import clsx from "clsx";

export const Button = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
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
      {children}
    </button>
  );
};
