import ReactEcharts from "echarts-for-react";
import { useSnapshot } from "valtio";
import { storyActions, storyGetters, storyState } from "../../store/storyStore";
import { MessageStage, StoryMessage } from "../../types";

interface Node {
  msg: StoryMessage;
  name: number;
  children: Node[];
  itemStyle?: any;
  lineStyle?: any;
  emphasis?: any;
}

interface EChartsClickParams {
  data: {
    msg: {
      story_id: string;
      id: string;
    };
  };
}

const onEvents = {
  click: (params: EChartsClickParams) => {
    const node = params.data;
    // 使用 ID 而不是对象引用，确保总是触发更新
    storyActions.selectStoryMessageById(node.msg.story_id, node.msg.id);
  },
};

const getOption = (data: any) => ({
  // tooltip: {
  //   trigger: "item",
  //   renderMode: "richText",
  //   formatter: (params) => {
  //     const msg = params.data.msg;
  //     return msg.content;
  //   },
  //   rich: {
  //     contentStyle: {
  //       color: "#333",
  //       fontSize: 12,
  //       padding: [10, 10, 5, 10],
  //       // 如果内容太长，可以设置最大宽度并自动换行
  //       width: 200,
  //       // overflow: "breakAll",
  //     },
  //   },
  // },
  series: [
    {
      type: "tree",
      data: [data],
      top: "10%",
      left: "10%",
      bottom: "10%",
      right: "10%",
      orient: "vertical",                                                    
      symbolSize: 40,
      initialTreeDepth: -1,
      expandAndCollapse: false,
      roam: true,
      layout: {
        nodeSeparation: 20, // 同一层级节点间的最小距离
        levelSeparation: 40, // 不同层级间的最小距离
      },
      label: {
        show: false,
      },
      leaves: {
        label: {
          show: false,
        },
      },
      animationDuration: 400,
      animationDurationUpdate: 700,
    },
  ],
});

const itemStyles: Record<MessageStage, object> = {
  initial: {
    color: "#1890ff", // 蓝色，表示初始状态
    borderColor: "#096dd9",
    borderWidth: 2,
  },
  inProgress: {
    color: "#faad14", // 橙色，表示进行中
    borderColor: "#d48806",
    borderWidth: 2,
    shadowBlur: 8,
    shadowColor: "rgba(250, 173, 20, 0.3)",
  },
  completed: {
    color: "#52c41a", // 绿色，表示已完成
    borderColor: "#389e0d",
    borderWidth: 2,
    shadowBlur: 6,
    shadowColor: "rgba(82, 196, 26, 0.2)",
  },
};


const StoryTree = () => {
  const { currentStoryMessage, storyCache } = useSnapshot(storyState);
  const storyBranchMessages = useSnapshot(storyGetters).storyBranchMessages;
  const storyId = currentStoryMessage?.story_id ?? "";
  const story = storyCache[storyId];
  if (!story) {
    return <div>请先选择一个故事</div>;
  }
  const mp = {} as Record<string, Node>;
  story.story_messages.forEach(
    (m, i) => (mp[m.id] = { msg: m as StoryMessage, name: i, children: [] })
  );
  function buildTreeRoot(node: Node, depth: number) {
    if (node.msg.role === 'user') return buildTreeRoot(mp[node.msg.children_id[0]], depth + 1);
    node.itemStyle = itemStyles[node.msg.stage];
    if (storyBranchMessages[depth] && storyBranchMessages[depth].id === node.msg.id) {
      node.itemStyle = {
        ...node.itemStyle,
        shadowBlur: 10,
        shadowColor: "#ff4d4f",
      };
      node.lineStyle = {
        color: "#333", 
      };
    }
    for (const cid of node.msg.children_id) {
      const child = mp[cid];
      if (child) node.children.push(buildTreeRoot(child, depth + 1));
    }
    return node;
  }
  const data = buildTreeRoot(mp[story.story_messages[0].id], 0);
  const option = getOption(data);

  return (
    <div className="w-full h-full overflow-hidden">
      <ReactEcharts
        option={option}
        onEvents={onEvents}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default StoryTree;
