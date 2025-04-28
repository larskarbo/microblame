import Layout from "@/components/layout/Layout";
import { trpc } from "@/utils/trpc";

export const Project = () => {
  const { data: me } = trpc.me.useQuery();
  return (
    <Layout>
      <div className="p-8">
        <div className="">
          <h1 className="text-2xl font-semibold">Connections</h1>
          <div className="py-10"></div>
        </div>
      </div>
    </Layout>
  );
};

export default Project;
