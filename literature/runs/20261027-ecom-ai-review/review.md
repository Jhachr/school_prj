# 文献综述初稿：AI 生成初稿 + 学生审题的作业改造对判断准确率的影响

## 检索记录

- Run 目录：`/Users/jhachr/ai_project/school_prj/literature/runs/20261027-ecom-ai-review`
- 检索日期：2026-10-27；来源：OpenAlex 接口（原始返回存于 `raw/openalex.jsonl`）。
- 检索式共 4 组，全部成功、无零结果：zh-1「生成式人工智能 大学生 过度依赖 批判性思维 教学干预」；zh-2「电子商务 课程教学 人工智能 作业改革 学生 审核」；en-1「students critically evaluating AI-generated content intervention higher education」；en-2「generative AI overreliance cognitive offloading students assignment design」。每组返回 20 条，共 80 条原始候选，精确去重后 77 条（重复 3 条）。年份限定 2022–2026。
- 筛选结果：纳入 19 条、待判断 29 条、排除 29 条。纳入记录中有一对内容重复（openalex:W7162459568 与 openalex:W7162706621，同一研究两条记录），取证时只用其一；另有一条纳入记录无摘要（openalex:W7220842318），不能用作证据。
- 覆盖与访问限制：OpenAlex 对中文文献覆盖有限，中文检索式命中多为近两年国内期刊的摘要级记录；全部证据停留在摘要层级，未获取全文，付费墙与数据库全文访问均未打通；未检索 CNKI、万方等中文库与 ERIC 等教育专题库。

## 已有研究如何解释或处理该问题

**问题侧：AI 使用如何削弱判断。** 横断面调查显示学生 AI 使用量与认知卸载显著正相关、与批判性思维显著负相关，尽管该样本中卸载的中介效应未显著 [C01]。对中国大学生的聚类研究进一步区分出从"简单问答"到"批判性协同思考"的使用画像，卸载深度正向预测认知自主让渡，并识别出"高深度—高依赖"子群体 [C02]。质性研究在学生作业反思中同时看到保留评价判断的策略性卸载与失控的过度依赖，两类模式可并存于同一学生身上 [C03]。更具警示性的是学习结果层面的证据：AI 支持期作业分数的提高没有迁移到后续考试，聊天机器人使用量与考试分负相关 [C04]。系统综述则指出，AI 的事实性错误会被学生当作真实信息接受，且这一风险与学生能力反向分布——越弱的学生越难识别错误 [C05]。

**干预侧：让学生审核 AI 产出的设计。** 系统综述提出"拐杖—教练"双路径：答案优先的使用关联更弱的核验实践，而含核验提示、反思检查点的过程优先设计与更强的认识警觉、校准和错误检测更一致地关联 [C09]。实证上，对 AI 产出做事实核查是与批判性思维关联最强的行为，且仅怀疑而不核验者反而表现更差 [C07]。最接近本课题设计的是一项 8 周准实验："受限 AI 支持 + 强制反思"条件在第 8 周独立无 AI 迁移任务上优于开放协作条件，机制上开放协作预测更深的认知卸载、进而关联更低的迁移表现 [C08]。网络安全课程的 SAGE 框架让学生生成、批判并精炼 AI 产出，报告了评估能力的增强，但也观察到 AI 依赖与素养差异的挑战 [C06]。

**与本课题设计的直接呼应。** 中文职教研究提出"AI 初评—学生修正—教师终评"的评价流程与过程性证据链 [C10]；商科课程建设把"结果核验"列为可培养的能力目标 [C12]；整合性综述则把"工具介入后学生能否继续完成必要的判断、重构和练习"指为认知增强与认知替代的分界，支持把审题判断表现设为观测点 [C11]。

## 实践的支持证据与限制证据

支持证据（均在摘要层级）：强制反思/核验类设计与更好的独立迁移表现相关联 [C08]；核验行为与批判性思维的强相关 [C07]；过程优先设计与错误检测、校准的一致关联 [C09]；中文职教与商科场景已存在同构的流程设计与能力目标 [C10][C12]。

限制证据：AI 助益的作业表现可以不迁移到独立情境 [C04]；卸载深度与依赖度的正相关 [C02]；AI 错误被当作真实信息接受的风险对能力弱的学生更高 [C05]；横断面数据中卸载—思维的中介路径未显著 [C01]；中文整合综述判断现有证据尚不足以证明长期技能衰退 [C11]。限制证据并不否定干预方向，但提示"用了 AI+审题"不等于自动见效，且前后测若只测带 AI 的作业表现可能高估效果 [C04][C08]。

## 对本课题场景的启示

**文献发现**（摘要直接报告的内容）：与"AI 初稿 + 强制审题"最接近的准实验显示，带强制反思的受限 AI 支持在独立迁移任务上优于开放使用 [C08]；核验 AI 产出的行为本身与批判性思维关联最强 [C07]；过程优先设计（含核验提示与反思检查点）与更好的校准和错误检测一致相关 [C09]；AI 错误被接受的风险受领域知识调节且与学生能力反向分布 [C05]。

**系统解读**（本综述对多条证据的综合）：各证据合起来支持一个工作假设——把"审题找错+写依据"显性化、强制化，是在把学生从"答案优先"路径推向"过程优先"路径 [C07][C09]；但准实验作者自评其证据为"课堂层面、机制一致的关联"，且强制反思与委托限制捆绑，不能分离出"审题单"的独立贡献 [C08]；同时，迁移证据提示本课题前后测若包含"无 AI 条件下独立判断"的测点，会比只测带 AI 作业更有说服力 [C04][C08]；能力弱的学生恰是最难识别 AI 错误的群体，干预效果可能在学生间不均匀 [C05]。

**给教师的建议**（解读之上的操作化提议，非文献直接结论）：一是审题单中"写依据"对应文献中的核验实践与反思检查点，建议保留并作为评分点 [C07][C09]；二是 3 次作业的选品分析可参照"原始作品—修改过程—AI 反馈—教师意见"留痕，便于过程性评价 [C10]；三是把学生按使用画像（如简单问答式 vs 批判协同式）分层观察，避免平均值掩盖"高深度—高依赖"学生 [C02]。

## 尚不能下结论的部分

- 核验层级：全部证据为摘要层级、状态 unresolved，无法排除摘要与全文不一致的可能。
- 强制审题的独立效果：最接近的准实验中强制反思与 AI 使用限制捆绑，"审题单"单独的效应在本检索范围内无直接证据 [C08]。
- 电商/选品情境：本范围内未见电商选品分析作业的直接干预研究，只有相邻的商科课程建设与职教评价设计 [C10][C12]，能否迁移到选品任务不可下定论。
- 长期效应：整合综述判断现有证据不足以证明长期技能衰退 [C11]，与"认知萎缩初步证据"的表述 [C05] 之间的张力在本范围内无法裁决。
- "研究空白"说明：以上仅为本次检索范围（OpenAlex、4 组检索式、2022–2026、摘要级）内的线索，不能作为全域空白的主张；中文库与 ERIC 等未检索。

## 参考文献

1. The SAGE framework for developing critical thinking and responsible generative AI use in cybersecurity education (2025). [record:openalex:W4416717095]
2. Creative offloading and creative agency in AI-assisted educational game design: A thematic analysis of student reflection essays (2026). [record:openalex:W7162459568]
3. Cognitive Crutch or Cognitive Coach? A Systematic Literature Review on Generative AI and Critical Thinking in Higher Education (2026). [record:openalex:W7164707932]
4. When Thinking Is Outsourced: Cognitive Offloading and the Heterogeneity of Critical Thinking Among Chinese University Students Using Generative Artificial Intelligence (2026). [record:openalex:W7165790702]
5. Machine Learning for Predictive Evaluation of Students' Interactions with AI-Generated Content and Their Critical Thinking Levels (2025). [record:openalex:W7166539371]
6. The Double-Edged Sword of Automation: Impact of Generative Ai Adoption on Student's Critical Thinking Skills in Higher Education Considering Cognitive Offloading as a Mediator (2026). [record:openalex:W7203540081]
7. Layer-sensitive cognitive offloading in generative AI-assisted writing: supported performance and independent no-AI outcomes (2026). [record:openalex:W7204495850]
8. Reliability Risks of Generative AI in Education: A Systematic Review of Hallucinations, Misinformation, Overreliance, and Assessment Validity (2026). [record:openalex:W7210283623]
9. 生成式人工智能赋能中职财经商贸类课程学业评价的内在逻辑、场景风险与优化路径 (2026). [record:openalex:W7213556044]
10. 智能商业能力导向的商科人工智能课程建设研究 (2026). [record:openalex:W7220151103]
11. 生成式人工智能影响大学生学习的作用机制——AI素养、自我调节学习与认知卸载的整合性综述 (2026). [record:openalex:W7220386030]
12. Supporting or Replacing Students' Reasoning? Cognitive Offloading in AI-Assisted Proof Learning (2026). [record:openalex:W7223388822]

## 给教师的问题

1. 校内或行业内是否有更近的电商选品实训材料、往届学生作业样本或企业选品标准，可用来校准"判断 AI 产出对错"的评分标准？
2. 3 次作业之间是否计划插入审题策略的显性讲评（文献中"核验提示/反思检查点"的对应物），还是仅布置审题单不讲评？
3. 前后测的"判断准确率"题目是否与作业同源但无 AI 辅助（独立测点），以对应文献中的迁移证据？

## 缺失或未核验证据

- 全部 77 条记录的 verification_status 均为 unresolved（暂未核验：当前公共源无法确认全文，仅获得摘要层级证据）。
- 纳入记录 openalex:W7220842318（From Support to Substitution 系统综述）无可用摘要，未作取证。
- 重复记录 openalex:W7162706621 与 openalex:W7162459568 内容相同，仅后者进入证据链。
- 未获得任何全文、量表细节与原始数据；中文数据库未检索。

## 可追溯检查

- 校验脚本：`node check-literature-run.mjs --input <run 目录>`，执行日期 2026-10-27，结果 `{"ok":true,"errors":[],"counts":{"records":77,"claims":12,"cited_records":12}}`。
- 脚本通过不等于语义上充分支持，已另行人工抽查 3 条论点：
  - C04（openalex:W7223388822）：excerpt 逐字含"作业高 2.56 分但考试无显著差异""每 100 条消息关联考试低 3.02 分"，claim 表述未超出；其消息数—考试分关联为观测性证据，已在 limitations 注明。抽查结论：支撑成立。
  - C08（openalex:W7204495850）：excerpt 覆盖三条件分组、第 8 周各维度差值、卸载的机制关联及作者自评"课堂层面、机制一致的关联"；claim 数值与限定语一致。抽查结论：支撑成立。
  - C05（openalex:W7210283623）：excerpt 逐字含"错误被当作失实信息接受、受领域专长调节""过度依赖伴初步认知萎缩证据""风险与学生能力反向分布"；claim 表述未超出。抽查结论：支撑成立。
- 其余论点在写入 claims.jsonl 前已经由脚本断言 excerpt 为摘要逐字子串（含中文摘要的标点），语义抽查仅覆盖上述 3 条，未抽查论点的语义支持仍需后续全文核验确认。
