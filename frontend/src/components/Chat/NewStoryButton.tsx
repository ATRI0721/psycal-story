import { useMutation } from "@tanstack/react-query";
import { storyService } from "../../services/storyService";
import { useSnapshot } from "valtio";
import { uiState } from "../../store/uiStore";

export const NewStoryButton = () => {
  const createStoryMutation = useMutation({
    mutationFn: storyService.createStory,
    onSuccess: (newStory) => {
      if (newStory?.id) {
        storyService.loadStory(newStory.id);
      }
    },
    onError: (error) => {
      console.error("创建故事失败:", error);
    },
  });
  const { loading } = useSnapshot(uiState);

  return (
    <button
      onClick={() => createStoryMutation.mutate("新故事")}
      disabled={createStoryMutation.isPending || loading}
      className="btn btn-soft btn-primary"
    >
      <span>
        {createStoryMutation.isPending || loading ? "创建中..." : "开启新故事"}
      </span>
    </button>
  );
};
