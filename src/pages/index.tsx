import { GetServerSideProps } from "next";

const Home = () => {};

export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
  // eslint-disable-next-line @typescript-eslint/require-await
}) => {
  return {
    redirect: {
      destination: `/dashboard`,
      permanent: false,
    },
  };
};

export default Home;
