declare module "lucide-react" {
  import type { SVGProps } from "react";
  export type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };
  export type Icon = (props: IconProps) => JSX.Element;
  export const Activity: Icon;
  export const AlertTriangle: Icon;
  export const Bot: Icon;
  export const Crosshair: Icon;
  export const ExternalLink: Icon;
  export const FlaskConical: Icon;
  export const Flame: Icon;
  export const Globe2: Icon;
  export const Magnet: Icon;
  export const MapPin: Icon;
  export const Play: Icon;
  export const Radio: Icon;
  export const RefreshCw: Icon;
  export const Satellite: Icon;
  export const Send: Icon;
  export const Shield: Icon;
  export const Sparkles: Icon;
  export const Sun: Icon;
  export const Wind: Icon;
  export const X: Icon;
  export const Zap: Icon;
  const _default: Record<string, Icon>;
  export default _default;
}
