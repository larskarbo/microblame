import { useAtom } from "jotai/react";
import { atomWithStorage } from "jotai/utils";
import { trpc } from "../../utils/trpc";
import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";

export const selectedProjectAtom = atomWithStorage<string | null>(
  "project",
  null
);

export const UserAndProjectConfig = () => {
  const [selectedProject, setSelectedProject] = useAtom(selectedProjectAtom);
  const router = useRouter();
  const { mutate: createProject } = trpc.project.createProject.useMutation({
    onSuccess: (project) => {
      setSelectedProject(project.name);
      router.push(`/dashboard/setup`);
    },
    onError: (error) => {
      alert(error);
    },
  });

  const { data: me } = trpc.me.useQuery();

  const promptCreateProject = () => {
    const projectName = prompt("Project name");
    if (!projectName) {
      return;
    }
    createProject({ name: projectName });
  };

  useEffect(() => {
    if (me && me.Team.Projects.length === 0) {
      promptCreateProject();
    }
  }, [me?.Team.Projects.length]);

  return (
    <div className="text-xxs">
      <div className="flex items-center gap-2 mb-2">
        <div className="">Project:</div>
        {me?.name}
        {me && (
          <select
            className="text-xs "
            value={selectedProject || ""}
            onChange={(event) => setSelectedProject(event.target.value)}
          >
            {me.Team.Projects.map((project) => (
              <option
                key={project.id}
                value={project.name}
                selected={project.name === selectedProject}
              >
                {project.name}
              </option>
            ))}
          </select>
        )}
        <button className="hover:underline" onClick={promptCreateProject}>
          [create project]
        </button>
      </div>
      <div className="flex gap-2 text-xxs">
        <div className="">User: {me?.name}</div>
        <button
          className="hover:underline"
          onClick={() => {
            signOut();
          }}
        >
          [logout]
        </button>
      </div>
    </div>
  );
};
