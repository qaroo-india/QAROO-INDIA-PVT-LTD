import Icon, { iconForLabel, TRUST_ICONS } from './Icon';

/**
 * A list line prefixed with an icon chosen from the line's own wording, so the
 * mark always states what the item is about. Lines about security, data or
 * verification get a status pulse on hover via the `is-secure` modifier.
 *
 * @param {object} props
 * @param {string} props.label copy for the line, also used to pick the icon
 * @param {string} [props.icon] explicit icon name, overriding the keyword match
 * @param {'li'|'div'} [props.as] element to render
 */
export default function FeatureLine({ label, icon, as: Tag = 'li', className = '', children }) {
  const name = icon || iconForLabel(label);

  return (
    <Tag className={`feature-line ${className}`.trim()}>
      <span className={`feature-line__ico${TRUST_ICONS.has(name) ? ' is-secure' : ''}`}>
        <Icon name={name} size={15} strokeWidth={1.8} />
      </span>
      <span className="feature-line__text">{children ?? label}</span>
    </Tag>
  );
}
