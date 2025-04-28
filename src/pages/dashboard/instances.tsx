import { useEffect, useRef, useState } from "react";
import * as Plot from "@observablehq/plot";
import { Button } from "@/components/Button";
import Layout from "@/components/layout/Layout";
import { QueryRow } from "@/components/QueryRow";
import { Spinner } from "@/components/Spinner";
import { trpc } from "@/utils/trpc";
import Link from "next/link";

export const Instances = () => {
  const { data: me } = trpc.me.useQuery();
  const { data: instances } = trpc.insight.getInstancesWithInsights.useQuery();
  console.log("instances: ", instances);

  if (!me || !instances) {
    return null;
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="">
          <h1 className="text-2xl font-semibold">Postgres Instances</h1>
          <div className="py-10"></div>
          <div className="space-y-4">
            {instances.map(({ instance, connectionDataPoints }) => (
              <div key={instance.id} className=" gap-4 items-center border p-2">
                <div className="text-sm w-64 pb-4">{instance.name}</div>
                <Link href={`/dashboard`} passHref key={instance.id} legacyBehavior>
                  <Button>Top queries</Button>
                </Link>
                <ConnectionsPlot plotData={connectionDataPoints} />
              </div>
            ))}

            {instances.length === 0 && (
              <div className="bg-yellow-100 text-yellow-800 text-xs p-2 rounded-md">
                No Postgres instances found
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const ConnectionsPlot = ({
  plotData,
}: {
  plotData: {
    time: Date;
    count: number;
  }[];
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const plot = Plot.plot({
      height: 100,
			width: 300,
      y: {
        grid: false,
        label: null,
        ticks: 3,
      },
      x: {
        label: null,
        tickRotate: 90,
        ticks: 3,
      },
      marks: [
        Plot.lineY(plotData, {
          x: "time",
          y: "count",
					stroke: "steelblue",
        }),
        Plot.areaY(plotData, {
          x: "time",
          y: "count",
          fillOpacity: 0.2,
					fill: "steelblue",
        }),
        Plot.ruleY([0], { stroke: "transparent" }),
        Plot.ruleY([1000], { stroke: "transparent" }),
      ],
      color: {
        legend: false,
        scheme: "Blues",
      },
    });
    containerRef.current!.append(plot);
    return () => plot.remove();
  }, [plotData]);

  return <div ref={containerRef} className=""></div>;
};

export default Instances;
