import cx from "classnames";

export type CardVariant =
  | "default"
  | "project"
  | "memo"
  | "feature"
  | "stat"
  | "profile";

import { cn } from "@/lib/utils";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: CardVariant;
  href?: string;
  onClick?: () => void;
}

export function Card({
  children,
  className,
  style,
  variant = "default",
  href,
  onClick,
}: CardProps) {
  const isInteractive = Boolean(href || onClick);
  const isButton = Boolean(onClick);

  const classes = cx(
    "flex flex-col bg-card border-1 border-border overflow-clip ",
    {
      "p-3": variant == "default",
    },
    {
      "cursor-pointer hover:-translate-[0.125rem] hover:shadow-md focus:outline-offset-[0.125rem]":
        isInteractive,
      "w-full align-left": isButton,
    },
    className,
  );

  if (href) {
    return (
      <a href={href} className={classes} style={style}>
        {children}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={classes} style={style} onClick={onClick}>
        {children}
      </button>
    );
  }

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}

/*******************************************************************************
 * Card Subcomponents
 ******************************************************************************/

export interface CardImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function CardImage({ src, alt, className }: CardImageProps) {
  return (
    <div className={cx("bc-card__image", className)}>
      <img src={src} alt={alt} />
    </div>
  );
}

export interface CardIconProps {
  children: React.ReactNode;
  className?: string;
}

export function CardIcon({ children, className }: CardIconProps) {
  return <div className={cx("bc-card__icon", className)}>{children}</div>;
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cx("bc-card__content", className)}>{children}</div>;
}

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: "h2" | "h3" | "h4" | "h5" | "h6";
}

export function CardTitle({
  children,
  className,
  as: Component = "h3",
}: CardTitleProps) {
  return (
    <Component className={cx("bc-card__title", className)}>
      {children}
    </Component>
  );
}

export interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return <p className={cx("bc-card__description", className)}>{children}</p>;
}

export interface CardMetaProps {
  children: React.ReactNode;
  className?: string;
}

export function CardMeta({ children, className }: CardMetaProps) {
  return <div className={cx("bc-card__meta", className)}>{children}</div>;
}

export interface CardStatProps {
  value: string | number;
  label: string;
  change?: string;
  changeDirection?: "up" | "down" | "neutral";
  className?: string;
}

export function CardStat({
  value,
  label,
  change,
  changeDirection,
  className,
}: CardStatProps) {
  return (
    <div className={cx("bc-card__stat", className)}>
      <span className="bc-card__stat-value">{value}</span>
      <span className="bc-card__stat-label">{label}</span>
      {change && (
        <span
          className={cx("bc-card__stat-change", {
            "bc-card__stat-change--up": changeDirection === "up",
            "bc-card__stat-change--down": changeDirection === "down",
          })}
        >
          {change}
        </span>
      )}
    </div>
  );
}

export interface CardAuthorProps {
  name: string;
  role?: string;
  avatar?: string;
  className?: string;
}

export function CardAuthor({ name, role, avatar, className }: CardAuthorProps) {
  return (
    <div className={cx("bc-card__author", className)}>
      {avatar && (
        <img src={avatar} alt={name} className="bc-card__author-avatar" />
      )}
      <div className="bc-card__author-info">
        <span className="bc-card__author-name">{name}</span>
        {role && <span className="bc-card__author-role">{role}</span>}
      </div>
    </div>
  );
}

export default Card;
