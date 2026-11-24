import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  TiktokLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { type SocialPlatform, socialLinks } from "@/config/site";
import { cn } from "@/helpers/classname-helper";

const icons: Record<SocialPlatform, Icon> = {
  youtube: YoutubeLogoIcon,
  facebook: FacebookLogoIcon,
  instagram: InstagramLogoIcon,
  tiktok: TiktokLogoIcon,
};

type SocialIconsProps = {
  className?: string;
  /** Override hrefs with staff-edited values from site_settings. */
  hrefs?: Partial<Record<SocialPlatform, string>>;
};

export function SocialIcons({ className, hrefs }: SocialIconsProps) {
  return (
    <ul className={cn("flex items-center gap-2", className)}>
      {socialLinks.map(({ platform, label, href }) => {
        const IconCmp = icons[platform];
        return (
          <li key={platform}>
            <a
              href={hrefs?.[platform] ?? href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Sparks Properties on ${label} (opens in a new tab)`}
              className="grid size-10 place-items-center rounded-full border border-hairline text-current/80 transition-[color,border-color,background-color] duration-200 hover:border-gold hover:bg-gold/8 hover:text-gold"
            >
              <IconCmp className="size-5" weight="regular" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
