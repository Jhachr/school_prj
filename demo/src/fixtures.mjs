export const liveCommerceFixture = {
  title: "科研立项引导助手流程验证 Demo",
  scenario: "小白老师从“AI+教育”收敛到直播电商实训教学改革课题",
  boundary:
    "本页面只验证流程、判断和产物结构；正式版本将在成熟 Harness 中运行科研立项 Skill。",
  gradeInput: {
    teacherProfileConfirmed: true,
    realProblemConfirmed: true,
    topicConfirmed: true,
    researchQuestionConfirmed: true,
    methodExecutable: true,
    nonPaperOutcomeConfirmed: true,
    guideSource: "demo_fixture",
    templateSource: "missing",
  },
  facts: {
    teacher: {
      value: "李老师，管理与数字经济学院网络营销与直播电商专业专任教师",
      sourceType: "user_confirmed",
      sourceLabel: "演示对话中由教师确认",
    },
    courses: {
      value: "新媒体直播运营、网店运营与管理、文案创意与撰写",
      sourceType: "user_confirmed",
      sourceLabel: "演示对话中由教师确认",
    },
    officialMajor: {
      value: "学校官网列示专业为“网络营销与直播电商”，所属管理与数字经济学院。",
      sourceType: "material_verified",
      sourceLabel:
        "四川国际标榜职业学院官网，网络营销与直播电商专业页，访问日期：2026-08-16",
    },
    officialPractice: {
      value:
        "官网介绍该专业强调实践性、技术性、多元性，课程体系与行业产业需求紧密结合，并配备直播实训室、摄影实训室、营销实训室以及综合直播基地。",
      sourceType: "material_verified",
      sourceLabel:
        "四川国际标榜职业学院官网，网络营销与直播电商专业页，访问日期：2026-08-16",
    },
    realProblem: {
      value:
        "学生能模仿直播话术，但选品、人群分析、脚本策划和数据复盘能力不足；课堂实训与企业直播运营岗位任务衔接不够。",
      sourceType: "user_confirmed",
      sourceLabel: "演示对话中由教师确认",
    },
    topicName: {
      value: "岗位任务导向的直播电商实训教学改革研究",
      sourceType: "ai_suggestion",
      sourceLabel: "系统基于教师画像、真实问题和演示指南生成，需教师最终采纳",
    },
    researchQuestion: {
      value:
        "在专科网络营销与直播电商专业的新媒体直播运营课程中，如何基于企业真实直播运营岗位任务重构实训项目，并通过数据复盘评价量表提升学生直播策划、执行和复盘能力？",
      sourceType: "user_confirmed",
      sourceLabel: "系统草拟后由教师确认",
    },
    evidence: {
      value:
        "模拟指南鼓励职业教育教学改革、产教融合、课程资源建设、评价工具和岗位能力提升。",
      sourceType: "demo_fixture",
      sourceLabel: "演示占位指南，不代表学校真实申报文件",
    },
    template: {
      value: "学校真实申报书模板尚未提供。",
      sourceType: "missing",
      sourceLabel: "第二版真实材料 Demo 前需由科研处提供",
    },
  },
  topicOptions: [
    {
      title: "岗位任务导向的直播电商实训教学改革研究",
      reason: "覆盖岗位任务、实训流程、评价工具和可复用成果。",
      risk: "企业直播项目案例和真实模板仍需补充。",
      selected: true,
    },
    {
      title: "基于数据复盘的直播运营实训评价体系构建研究",
      reason: "聚焦学生不会分析直播过程数据的问题。",
      risk: "范围较窄，需证明对课程整体改革的带动作用。",
      selected: false,
    },
    {
      title: "AI 辅助下直播脚本诊断与优化的教学应用研究",
      reason: "保留 AI 工具价值，适合脚本质量提升。",
      risk: "容易被误解为工具应用课题，申报价值需要收敛。",
      selected: false,
    },
  ],
  dialogueSteps: [
    {
      stage: "空泛意图纠偏",
      speaker: "teacher",
      text: "我想做一个 AI+教育 的课题，帮我写个课题申报。",
      status: "C",
      note: "阻断：缺少课程、对象、真实问题和数据来源。",
    },
    {
      stage: "空泛意图纠偏",
      speaker: "assistant",
      text:
        "这个方向现在还不能直接生成申报材料。“AI+教育”太宽泛，我需要先确认专业、课程、学生问题和可获得数据。",
      status: "C",
      note: "允许输出：继续追问，不生成申报材料。",
    },
    {
      stage: "教师画像采集",
      speaker: "teacher",
      text:
        "我是网络营销与直播电商专业老师，教新媒体直播运营和网店运营与管理。学生会模仿话术，但选品、脚本和数据复盘比较弱。",
      status: "C",
      note: "教师画像和真实问题开始形成。",
    },
    {
      stage: "工作问题挖掘",
      speaker: "assistant",
      text:
        "核心问题可能不是 AI 工具，而是直播电商岗位任务和课程实训没有充分对齐。请确认是否更想解决直播全流程能力问题。",
      status: "C",
      note: "AI 建议需用户确认，不能替代教师判断。",
    },
    {
      stage: "工作问题挖掘",
      speaker: "teacher",
      text: "认可。我最想解决的是学生不会把直播任务做完整，不是单纯上 AI 工具。",
      status: "C",
      note: "真实问题由用户确认。",
    },
    {
      stage: "文献与政策支撑",
      speaker: "assistant",
      text:
        "当前用模拟申报指南演示：若强调产教融合、课程资源、评价工具和岗位能力，比泛泛写 AI+教育更贴近申报导向。",
      status: "B",
      note: "依据为 demo_fixture，不能视为真实材料。",
    },
    {
      stage: "课题方向推荐与确认",
      speaker: "assistant",
      text:
        "建议 3 个方向：岗位任务导向实训改革、数据复盘评价体系、AI 辅助脚本诊断。我推荐第 1 个。",
      status: "B",
      note: "系统推荐，等待用户选择。",
    },
    {
      stage: "课题方向推荐与确认",
      speaker: "teacher",
      text: "我选第 1 个，企业案例、课程试点、学生作业和非论文成果都可以配合。",
      status: "B",
      note: "课题方向、资源条件和非论文成果由用户确认。",
    },
    {
      stage: "研究问题澄清",
      speaker: "assistant",
      text:
        "研究问题可表述为：如何基于企业真实直播运营岗位任务重构实训项目，并通过数据复盘评价量表提升学生直播策划、执行和复盘能力？",
      status: "B",
      note: "研究问题已可进入字段映射。",
    },
    {
      stage: "申报材料生成与质检",
      speaker: "assistant",
      text:
        "当前质量等级为 B：可生成课题方案卡、申报书字段映射稿、待补充清单和质量结果；不生成正式申报书草稿。",
      status: "B",
      note: "缺少真实申报指南和学校模板。",
    },
  ],
};
