import { evaluateGrade, SOURCE_LABELS } from "./state.mjs";

function entry(label, fact) {
  return {
    label,
    value: fact.value,
    sourceType: fact.sourceType,
    sourceLabel: fact.sourceLabel,
    badge: SOURCE_LABELS[fact.sourceType],
  };
}

export function buildDemoOutputs(fixture) {
  const { facts } = fixture;
  const quality = evaluateGrade(fixture.gradeInput);

  const topicCard = {
    title: entry("课题名称", facts.topicName),
    teacher: entry("教师画像", facts.teacher),
    courses: entry("课程场景", facts.courses),
    realProblem: entry("真实问题", facts.realProblem),
    officialMajor: entry("专业依据", facts.officialMajor),
    officialPractice: entry("实训条件", facts.officialPractice),
    researchQuestion: entry("核心研究问题", facts.researchQuestion),
    evidence: entry("政策/指南依据", facts.evidence),
    value: {
      label: "申报价值",
      value:
        "服务网络营销与直播电商专业建设，推动直播运营岗位任务进入课程实训，形成可复用任务包、评价量表和复盘模板。",
      sourceType: "ai_suggestion",
      sourceLabel: "系统建议，需科研处确认",
      badge: SOURCE_LABELS.ai_suggestion,
    },
    risks: [
      {
        value: "学校真实申报指南尚未接入，政策贴合度只能演示。",
        sourceType: "demo_fixture",
        sourceLabel: "演示边界",
      },
      {
        value: "学校真实申报书模板尚未提供，字段只能使用通用结构。",
        sourceType: "missing",
        sourceLabel: "第二版真实材料 Demo 前需补充",
      },
    ],
  };

  const proposalMapping = [
    {
      field: "课题名称",
      content: facts.topicName.value,
      sourceType: "ai_suggestion",
      status: "待教师最终确认",
    },
    {
      field: "研究背景",
      content:
        "网络营销与直播电商专业实训教学中，学生存在直播任务全流程能力不足的问题，尤其在选品、人群分析、脚本策划和数据复盘方面较弱。",
      sourceType: "user_confirmed",
      status: "可填",
    },
    {
      field: "研究目标",
      content:
        "构建岗位任务导向的新媒体直播运营实训任务体系，形成数据复盘评价量表和课堂实施方案，提升学生直播策划、执行和复盘能力。",
      sourceType: "ai_suggestion",
      status: "可填，需教师复核",
    },
    {
      field: "研究方法",
      content:
        "文献与政策分析、企业案例分析、行动研究、课堂观察、学生作业分析、直播数据复盘、学生反馈调查。",
      sourceType: "ai_suggestion",
      status: "可填，需补充样本和周期",
    },
    {
      field: "预期成果",
      content:
        "论文、直播电商岗位任务案例库、新媒体直播运营实训任务包、直播数据复盘评价量表、直播项目复盘模板、课堂实施方案。",
      sourceType: "user_confirmed",
      status: "可填",
    },
    {
      field: "研究现状",
      content:
        "暂以演示数据说明职业教育教学改革、产教融合、课程资源建设和评价工具方向；正式版必须替换为真实政策和文献。",
      sourceType: "demo_fixture",
      status: "待真实材料替换",
    },
    {
      field: "申报书模板适配",
      content: facts.template.value,
      sourceType: "missing",
      status: "待补充",
    },
  ].map((item) => ({ ...item, badge: SOURCE_LABELS[item.sourceType] }));

  const missingItems = [
    {
      id: "school_template",
      item: "学校真实申报书模板",
      why: "决定字段结构和后续导出格式。",
      owner: "科研处/项目联系人",
      milestone: "第二版真实材料 Demo 前",
      sourceType: "missing",
    },
    {
      id: "application_guide",
      item: "本期申报指南或征集通知",
      why: "决定课题方向是否贴合学校本期导向。",
      owner: "科研处",
      milestone: "第二版真实材料 Demo 前",
      sourceType: "missing",
    },
    {
      id: "excellent_examples",
      item: "1-3 份优秀申报书样例",
      why: "提炼学校认可的结构、表达和质量标准。",
      owner: "科研处/优秀教师",
      milestone: "第二版真实材料 Demo 前",
      sourceType: "missing",
    },
    {
      id: "review_rules",
      item: "评审标准或常见退回意见",
      why: "完善质量检查规则和追问策略。",
      owner: "科研处/评审专家",
      milestone: "第二版真实材料 Demo 前或会后补充",
      sourceType: "missing",
    },
  ].map((item) => ({ ...item, badge: SOURCE_LABELS[item.sourceType] }));

  const qualityReport = {
    grade: quality.grade,
    label: quality.label,
    reasons: quality.reasons,
    allowedOutputs: quality.allowedOutputs,
    nextAction: quality.nextAction,
  };

  return {
    topicCard,
    proposalMapping,
    missingItems,
    quality: qualityReport,
    proposalDraft: quality.allowedOutputs.includes("proposal_draft")
      ? "申报书结构化内容草稿需在 A 级条件满足后生成。"
      : null,
  };
}
