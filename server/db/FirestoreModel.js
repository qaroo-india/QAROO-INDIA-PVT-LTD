import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import db from './firebase.js';

// Global cache registry so models can populate each other (e.g. populating createdBy from admins)
const modelRegistry = new Map();

function sanitizeForFirestore(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Buffer.isBuffer(obj)) return obj.toString('base64');
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined && typeof item !== 'function')
      .map(sanitizeForFirestore);
  }
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined || typeof val === 'function') continue;
    clean[key] = sanitizeForFirestore(val);
  }
  return clean;
}

function matchesFilter(item, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, expected] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(expected)) {
      const anyMatch = expected.some((subFilter) => matchesFilter(item, subFilter));
      if (!anyMatch) return false;
      continue;
    }

    if (key === '$and' && Array.isArray(expected)) {
      const allMatch = expected.every((subFilter) => matchesFilter(item, subFilter));
      if (!allMatch) return false;
      continue;
    }

    const actual = item[key] !== undefined ? item[key] : (key === '_id' ? item.id : undefined);

    if (expected && typeof expected === 'object' && !(expected instanceof RegExp) && !(expected instanceof Date)) {
      if ('$exists' in expected) {
        const exists = actual !== undefined && actual !== null;
        if (Boolean(expected.$exists) !== exists) return false;
      }
      if ('$ne' in expected) {
        const neVal = String(expected.$ne);
        if (String(actual) === neVal) return false;
      }
      if ('$in' in expected && Array.isArray(expected.$in)) {
        if (!expected.$in.map(String).includes(String(actual))) return false;
      }
      if ('$nin' in expected && Array.isArray(expected.$nin)) {
        if (expected.$nin.map(String).includes(String(actual))) return false;
      }
      if ('$gte' in expected) {
        const expTime = new Date(expected.$gte).getTime();
        const actTime = new Date(actual).getTime();
        if (Number.isNaN(actTime) || Number.isNaN(expTime) || actTime < expTime) return false;
      }
      if ('$gt' in expected) {
        const expTime = new Date(expected.$gt).getTime();
        const actTime = new Date(actual).getTime();
        if (Number.isNaN(actTime) || Number.isNaN(expTime) || actTime <= expTime) return false;
      }
      if ('$lte' in expected) {
        const expTime = new Date(expected.$lte).getTime();
        const actTime = new Date(actual).getTime();
        if (Number.isNaN(actTime) || Number.isNaN(expTime) || actTime > expTime) return false;
      }
      if ('$lt' in expected) {
        const expTime = new Date(expected.$lt).getTime();
        const actTime = new Date(actual).getTime();
        if (Number.isNaN(actTime) || Number.isNaN(expTime) || actTime >= expTime) return false;
      }
      if ('$regex' in expected) {
        const pattern = expected.$regex instanceof RegExp
          ? expected.$regex
          : new RegExp(expected.$regex, expected.$options || 'i');
        if (!pattern.test(String(actual || ''))) return false;
      }
      continue;
    }

    if (expected instanceof RegExp) {
      if (!expected.test(String(actual || ''))) return false;
      continue;
    }

    if (expected === null) {
      if (actual !== null && actual !== undefined) return false;
      continue;
    }

    if (String(actual || '').toLowerCase() !== String(expected || '').toLowerCase()) {
      return false;
    }
  }

  return true;
}

class QueryBuilder {
  constructor(model, filter = {}, single = false) {
    this.model = model;
    this.filter = filter;
    this.single = single;
    this._sort = null;
    this._skip = 0;
    this._limit = null;
    this._populates = [];
    this._selects = [];
  }

  sort(sortSpec) {
    if (typeof sortSpec === 'string') {
      const parts = sortSpec.split(' ').filter(Boolean);
      const spec = {};
      for (const p of parts) {
        if (p.startsWith('-')) spec[p.slice(1)] = -1;
        else spec[p] = 1;
      }
      this._sort = spec;
    } else {
      this._sort = sortSpec;
    }
    return this;
  }

  skip(n) {
    this._skip = Number(n) || 0;
    return this;
  }

  limit(n) {
    this._limit = Number(n) || 0;
    return this;
  }

  populate(field, selectFields) {
    this._populates.push({ field, select: selectFields });
    return this;
  }

  select(fields) {
    if (typeof fields === 'string') {
      this._selects.push(...fields.split(' ').filter(Boolean));
    }
    return this;
  }

  lean() {
    return this;
  }

  async distinct(field) {
    const items = await this.exec();
    const values = new Set();
    const list = Array.isArray(items) ? items : (items ? [items] : []);
    for (const item of list) {
      const val = item[field];
      if (val !== undefined && val !== null) {
        if (Array.isArray(val)) val.forEach((v) => values.add(v));
        else values.add(val);
      }
    }
    return Array.from(values);
  }

  async exec() {
    return this.model._runQuery(this);
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

export class FirestoreModel {
  constructor(collectionName, customMethods = {}, defaultData = []) {
    this.collectionName = collectionName;
    this.customMethods = customMethods;
    this.inMemoryCache = new Map();
    this._initialized = false;
    this._syncPromise = null;
    modelRegistry.set(collectionName, this);

    if (Array.isArray(defaultData)) {
      for (const item of defaultData) {
        if (!item) continue;
        const id = String(item.id || item._id || crypto.randomUUID());
        this.inMemoryCache.set(id, {
          ...item,
          _id: id,
          id,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        });
      }
    }
  }

  _col() {
    return collection(db, this.collectionName);
  }

  _doc(id) {
    return doc(db, this.collectionName, String(id));
  }

  _wrapDoc(raw, selects = []) {
    if (!raw) return null;
    const docData = { ...raw };
    const id = String(docData.id || docData._id || crypto.randomUUID());
    docData._id = id;
    docData.id = id;

    // Apply positive selects if specified (e.g. select('_id'))
    const positiveSelects = selects.filter((s) => !s.startsWith('-') && !s.startsWith('+'));
    if (positiveSelects.length > 0) {
      const filtered = { _id: id, id };
      for (const f of positiveSelects) {
        if (docData[f] !== undefined) filtered[f] = docData[f];
      }
      return filtered;
    }

    const self = this;
    const wrapped = {
      ...docData,
      _id: id,
      id,
      toObject() {
        return { ...this };
      },
      toJSON() {
        const copy = { ...this };
        if (self.collectionName === 'admins') {
          delete copy.password;
          delete copy.verificationToken;
          delete copy.verificationOTP;
          delete copy.passwordOTP;
          delete copy.passwordOTPExpires;
          delete copy.passwordOTPAttempts;
          delete copy.resetTokenHash;
          delete copy.resetTokenExpires;
          delete copy.passwordChangedAt;
        }
        return copy;
      },
      markModified() {
        return this;
      },
      set(obj) {
        if (obj && typeof obj === 'object') {
          Object.assign(this, obj);
        }
        return this;
      },
      async deleteOne() {
        return self.findByIdAndDelete(this._id);
      },
      async save() {
        return self.findByIdAndUpdate(this._id, this, { new: true });
      },
      ...this.customMethods,
    };

    return wrapped;
  }

  async _ensureSync() {
    if (this._initialized) return;
    if (this._syncPromise) return this._syncPromise;

    this._syncPromise = (async () => {
      try {
        const fetchPromise = getDocs(this._col());
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firestore sync timeout')), 3500)
        );
        const snap = await Promise.race([fetchPromise, timeoutPromise]);
        snap.forEach((d) => {
          const data = d.data();
          this.inMemoryCache.set(d.id, {
            ...data,
            _id: d.id,
            id: d.id,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
          });
        });
      } catch {
        // Fallback: keep existing cache contents
      } finally {
        this._initialized = true;
        this._syncPromise = null;
      }
    })();

    return this._syncPromise;
  }

  async _populateField(item, pop) {
    const rawVal = item[pop.field];
    if (!rawVal) return item;

    // By default createdBy and updatedBy populate from 'admins'
    let targetModelName = 'admins';
    if (pop.field === 'job') targetModelName = 'job_postings';
    if (pop.field === 'resumeFileId') targetModelName = 'resume_files';

    const targetModel = modelRegistry.get(targetModelName);
    if (!targetModel) return item;

    const refDoc = await targetModel.findById(rawVal);
    if (!refDoc) return item;

    const populatedObj = { _id: refDoc._id, id: refDoc.id };
    if (pop.select) {
      const selFields = typeof pop.select === 'string' ? pop.select.split(' ') : [];
      for (const f of selFields) {
        if (refDoc[f] !== undefined) populatedObj[f] = refDoc[f];
      }
    } else {
      if (refDoc.name !== undefined) populatedObj.name = refDoc.name;
    }

    return { ...item, [pop.field]: populatedObj };
  }

  async _runQuery(builder) {
    await this._ensureSync();
    let results = Array.from(this.inMemoryCache.values()).filter((item) => matchesFilter(item, builder.filter));

    if (builder.single) {
      if (results.length === 0) return null;
      let singleItem = results[0];
      for (const pop of builder._populates) {
        singleItem = await this._populateField(singleItem, pop);
      }
      return this._wrapDoc(singleItem, builder._selects);
    }

    if (builder._sort) {
      const sortEntries = Object.entries(builder._sort);
      results.sort((a, b) => {
        for (const [key, dir] of sortEntries) {
          let valA = a[key];
          let valB = b[key];
          if (valA instanceof Date) valA = valA.getTime();
          if (valB instanceof Date) valB = valB.getTime();
          if (valA === undefined || valA === null) valA = '';
          if (valB === undefined || valB === null) valB = '';
          const direction = dir === -1 || dir === 'desc' ? -1 : 1;
          if (valA < valB) return -1 * direction;
          if (valA > valB) return 1 * direction;
        }
        return 0;
      });
    }

    if (builder._skip > 0) {
      results = results.slice(builder._skip);
    }

    if (builder._limit > 0) {
      results = results.slice(0, builder._limit);
    }

    const finalDocs = [];
    for (let item of results) {
      for (const pop of builder._populates) {
        item = await this._populateField(item, pop);
      }
      finalDocs.push(this._wrapDoc(item, builder._selects));
    }

    return finalDocs;
  }

  find(filter = {}) {
    return new QueryBuilder(this, filter, false);
  }

  findOne(filter = {}) {
    return new QueryBuilder(this, filter, true);
  }

  findById(id) {
    if (!id) return new QueryBuilder(this, { _id: '__nonexistent__' }, true);
    return new QueryBuilder(this, { _id: String(id) }, true);
  }

  async create(data) {
    const now = new Date();
    const copy = { ...data };

    if (this.collectionName === 'admins' && copy.password && !copy.password.startsWith('$2')) {
      copy.password = await bcrypt.hash(copy.password, 10);
    }

    const docId = String(copy._id || copy.id || crypto.randomUUID());
    delete copy._id;
    delete copy.id;

    const newDoc = {
      ...copy,
      createdAt: now,
      updatedAt: now,
    };

    const sanitized = sanitizeForFirestore(newDoc);
    try {
      await setDoc(this._doc(docId), {
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // offline/fallback: persist to inMemoryCache
    }

    const fullDoc = { ...newDoc, _id: docId, id: docId };
    this.inMemoryCache.set(docId, fullDoc);
    return this._wrapDoc(fullDoc);
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    if (!id) return null;
    const strId = String(id);
    await this._ensureSync();

    const existing = this.inMemoryCache.get(strId) || {};
    const cleanUpdate = { ...updateData };
    delete cleanUpdate._id;
    delete cleanUpdate.id;

    if (this.collectionName === 'admins' && cleanUpdate.password && !cleanUpdate.password.startsWith('$2')) {
      cleanUpdate.password = await bcrypt.hash(cleanUpdate.password, 10);
    }

    const updated = {
      ...existing,
      ...cleanUpdate,
      _id: strId,
      id: strId,
      updatedAt: new Date(),
    };

    const sanitizedUpdate = sanitizeForFirestore(cleanUpdate);
    try {
      await updateDoc(this._doc(strId), {
        ...sanitizedUpdate,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Fallback
    }

    this.inMemoryCache.set(strId, updated);
    return this._wrapDoc(options.new === false ? existing : updated);
  }

  async findByIdAndDelete(id) {
    if (!id) return null;
    const strId = String(id);
    await this._ensureSync();
    const existing = this.inMemoryCache.get(strId);

    try {
      await deleteDoc(this._doc(strId));
    } catch {
      // Fallback
    }

    this.inMemoryCache.delete(strId);
    return existing ? this._wrapDoc(existing) : null;
  }

  async deleteOne(filter = {}) {
    const item = await this.findOne(filter);
    if (!item) return { deletedCount: 0 };
    await this.findByIdAndDelete(item._id);
    return { deletedCount: 1 };
  }

  async updateOne(filter = {}, update = {}) {
    const item = await this.findOne(filter);
    if (!item) return { matchedCount: 0, modifiedCount: 0 };
    const updateData = update.$set ? update.$set : update;
    await this.findByIdAndUpdate(item._id, updateData, { new: true });
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async deleteMany(filter = {}) {
    const items = await this.find(filter);
    for (const item of items) {
      await this.findByIdAndDelete(item._id);
    }
    return { deletedCount: items.length };
  }

  async insertMany(docs = []) {
    const results = [];
    for (const doc of docs) {
      const created = await this.create(doc);
      results.push(created);
    }
    return results;
  }

  async distinct(field, filter = {}) {
    await this._ensureSync();
    const items = await this.find(filter);
    const values = new Set();
    const list = Array.isArray(items) ? items : (items ? [items] : []);
    for (const item of list) {
      const val = item[field];
      if (val !== undefined && val !== null) {
        if (Array.isArray(val)) {
          val.forEach((v) => values.add(v));
        } else {
          values.add(val);
        }
      }
    }
    return Array.from(values);
  }

  async findOneAndUpdate(filter = {}, update = {}, options = {}) {
    await this._ensureSync();
    const item = await this.findOne(filter);
    const updateData = update.$set ? update.$set : update;
    if (!item) {
      if (options.upsert) {
        const toCreate = {
          ...filter,
          ...updateData,
        };
        return this.create(toCreate);
      }
      return null;
    }
    return this.findByIdAndUpdate(item._id, updateData, options);
  }

  async countDocuments(filter = {}) {
    await this._ensureSync();
    return Array.from(this.inMemoryCache.values()).filter((i) => matchesFilter(i, filter)).length;
  }

  async estimatedDocumentCount() {
    await this._ensureSync();
    return this.inMemoryCache.size;
  }
}

export default FirestoreModel;
