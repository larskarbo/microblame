import {
  ChartBarSquareIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useRouter } from "next/router";
import React from "react";

const navigation = [
  {
    name: "Top Postgres Queries",
    href: "/",
    icon: ChartBarSquareIcon,
    current: true,
  },
  {
    name: "Setup",
    href: "/setup",
    icon: CommandLineIcon,
    current: false,
  },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  return (
    <div>
      <div className="fixed inset-y-0 z-50 flex flex-col w-72">
        <div className="flex flex-col px-6 overflow-y-auto grow gap-y-5 bg-black/10 ring-1 ring-white/5">
          <div className="flex items-center h-16 shrink-0">
            <div className="font-bold font-mono">
              microblame <span className="font-sans">⚡</span>
            </div>
          </div>
          <nav className="flex flex-col flex-1">
            <ul role="list" className="flex flex-col flex-1 gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isCurrent = router.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={clsx(
                            isCurrent
                              ? "bg-gray-50 text-gray-600"
                              : "text-gray-700 hover:text-gray-600 hover:bg-gray-50",
                            "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                          )}
                        >
                          <item.icon
                            className={clsx(
                              isCurrent
                                ? "text-gray-600"
                                : "text-gray-400 group-hover:text-gray-600",
                              "h-6 w-6 shrink-0"
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </li>

              <li className="p-4 mt-auto -mx-6 "></li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="pl-72">{children}</div>
    </div>
  );
};

export default Layout;
