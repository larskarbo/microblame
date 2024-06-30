import clsx from "clsx";
import { Spinner } from "./Spinner";

export const Button = ({
  children,
  className,
  isLoading,
  ...props
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
} & React.HTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={clsx(
        "border hover:bg-gray-100 text-gray-900 px-3 py-1.5 rounded-md text-xs disabled:opacity-50",
        className
      )}
      onClick={(e) => {
        if (props.disabled) {
          return;
        }
        props.onClick?.(e);
      }}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
};
