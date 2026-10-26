# SQL 审题题库 v0.1

> 用途：大一「MySQL数据库基础」课上，让学生**只审不写**——判断一条 SQL 是对是错、错在哪。
> 状态：`ai_suggestion（系统生成示例）`。题目与标准答案由助手生成并已用等价数据验证结果，**正式使用前请按你的教学进度和 MySQL 版本核对一遍**。
> 配套研究：判断 SQL 对错的准确率（前后测各一次）。

---

## 一、统一的表结构与数据

所有题目共用这一套数据，学生只需要看一次。

```sql
CREATE TABLE students(
  sid INT PRIMARY KEY,
  sname VARCHAR(20),
  gender VARCHAR(2),
  age INT,
  major VARCHAR(20)
);

CREATE TABLE courses(
  cid INT PRIMARY KEY,
  cname VARCHAR(30),
  credit INT,
  teacher VARCHAR(20)
);

CREATE TABLE scores(
  sid INT,
  cid INT,
  score INT,
  term VARCHAR(10)
);

INSERT INTO students VALUES
(1,'张伟','男',19,'计算机'),
(2,'李娜','女',20,'计算机'),
(3,'王强','男',20,'软件'),
(4,'赵敏','女',NULL,'计算机'),
(5,'陈晨','男',21,'软件'),
(6,'刘洋','女',19,'计算机');

INSERT INTO courses VALUES
(1,'数据库原理',3,'王老师'),
(2,'操作系统',3,'李老师'),
(3,'数据结构',4,'张老师'),
(4,'人工智能导论',2,'赵老师');

INSERT INTO scores VALUES
(1,1,85,'2026春'),
(1,2,78,'2026春'),
(2,1,92,'2026春'),
(2,3,88,'2026春'),
(3,1,55,'2026春'),
(3,2,60,'2026春'),
(4,1,70,'2026春'),
(5,3,95,'2026春'),
(6,1,NULL,'2026春');
```

注意：赵敏的 `age` 为空；刘洋的 `score` 为空；「人工智能导论」没有任何人选。

---

## 二、错因分类（评分时用）

| 代码 | 类型 | 典型表现 |
|---|---|---|
| G | 语法错 | 缺逗号、关键字拼错、子句顺序不对 |
| C | 子句使用错 | 聚合函数放进 WHERE、该用 HAVING 用了 WHERE、缺 GROUP BY |
| J | 连接错 | 该用 LEFT JOIN 用了 INNER JOIN、漏写连接条件 |
| S | 语义错 | SQL 能跑通，但结果与需求不符（过滤时机、聚合范围、NULL 处理） |
| R | 结果形态错 | 列、行、排序与需求不一致 |
| OK | 正确 | 无明显问题 |

---

## 三、题目

每题给学生：需求 + 一条 SQL；学生只需写「对 / 错」+ 一句理由。

### Q1（类型 G 语法错）

**需求**：查询所有学生的姓名和年龄。

```sql
SELECT sname age FROM students;
```

- **标准判断**：错
- **错因**：G 语法错，`sname` 与 `age` 之间缺逗号
- **会怎样**：MySQL 直接报语法错误（1064）

### Q2（类型 C 子句使用错）

**需求**：查询选课人数超过 1 人的课程名称。

```sql
SELECT cname FROM courses WHERE COUNT(*) > 1 GROUP BY cname;
```

- **标准判断**：错
- **错因**：C 子句使用错，聚合函数不能写在 WHERE 中，应改用 HAVING
- **会怎样**：MySQL 报 1111（Invalid use of group function）

### Q3（类型 S 语义错，重点题）

**需求**：计算每门课程的**平均分**（按全部选课记录）。

```sql
SELECT c.cname, AVG(s.score)
FROM scores s
JOIN courses c ON s.cid = c.cid
WHERE s.score >= 60
GROUP BY c.cname;
```

- **标准判断**：错
- **错因**：S 语义错。WHERE 在分组前就把不及格记录过滤掉了，算出来的是"及格学生的平均分"
- **实际差异**：数据库原理正确平均分为 75.5，这条 SQL 给出 82.33
- **课堂提示**：这是最值得讲的一题——SQL 能跑、不报错、数字看着也合理，但含义错了

### Q4（类型 J 连接错 + R 结果形态）

**需求**：列出**所有课程**及选课人数，没人选的课也要显示。

```sql
SELECT c.cname, COUNT(*)
FROM courses c
JOIN scores s ON c.cid = s.cid
GROUP BY c.cname;
```

- **标准判断**：错
- **错因**：J 连接错，INNER JOIN 丢掉了没有选课记录的「人工智能导论」；另外统计人数更稳妥的写法是 `COUNT(s.sid)`
- **实际差异**：结果只有 3 门课，缺「人工智能导论 0」

### Q5（类型 S 语义错，NULL）

**需求**：查询年龄**不是 20 岁**的学生（未填年龄的也算）。

```sql
SELECT sname FROM students WHERE age <> 20;
```

- **标准判断**：错
- **错因**：S 语义错。`age <> 20` 对 NULL 的结果是"未知"，赵敏不会被返回
- **实际差异**：返回张伟、陈晨、刘洋，缺赵敏
- **课堂提示**：NULL 比较是学生最容易漏判的一类

### Q6（类型 C 子句使用错，版本相关）

**需求**：统计每个学生每门课的选课记录条数。

```sql
SELECT sid, cid, COUNT(*) FROM scores;
```

- **标准判断**：错
- **错因**：C 子句使用错，缺 GROUP BY
- **会怎样**：MySQL 8 默认开启 `ONLY_FULL_GROUP_BY`，直接报 1140；若关闭该模式，会返回一行无意义的结果——**属于"有时能跑但一定错"**
- **课堂提示**：可以顺带讲 `sql_mode`，但不要展开太深

### Q7（类型 OK，正确）

**需求**：查询「数据库原理」（cid=1）成绩 80 分及以上的学生姓名。

```sql
SELECT sname
FROM students
WHERE sid IN (SELECT sid FROM scores WHERE cid = 1 AND score >= 80);
```

- **标准判断**：对
- **说明**：写法不算最优，但结果正确，用来防止学生"看到子查询就判错"

### Q8（类型 OK，正确）

**需求**：同 Q4——所有课程及选课人数，没人选的也要显示。

```sql
SELECT c.cname, COUNT(s.sid) AS cnt
FROM courses c
LEFT JOIN scores s ON c.cid = s.cid
GROUP BY c.cname
ORDER BY cnt DESC;
```

- **标准判断**：对
- **说明**：Q4 与 Q8 是同一需求的对错对照，建议**连着出**，看学生能不能分辨

---

## 四、学生答题卡（每题一行）

| 题号 | 判断（对/错） | 一句理由 | 用时 |
|---|---|---|---|
| Q1 |  |  |  |
| Q2 |  |  |  |
| ... |  |  |  |

## 五、教师记分表

| 学生 | 判对题数 | 准确率 | 主要错判类型 | 备注 |
|---|---|---|---|---|
|  | /8 |  |  |  |

判分口径：
- **判对**：判断（对/错）与标准答案一致
- **真会**：判对且理由指向正确错因；判对但理由错误记为"蒙对"
- **最常漏判类型**：按 G/C/J/S/R 统计，直接用于下一轮教学

---

## 六、前后测使用建议

1. 第 1 周用本套题做基线，第 9 周用**等难度另一套**（建议同结构换数据）。
2. 两套题难度请找一位同行先做一遍，避免一套明显更难。
3. 15 人一个班，结果只能说明"这个班发生了变化"，不要写成因果结论。
4. 扩展方向：每类错因再各补 2 题，形成 20 题左右的稳定题库。

---

## 七、来源状态

- 题目、标准答案、错因分类：`ai_suggestion（系统生成示例）`，待教师核对
- 数据与结果差异：已用等价数据实际执行核对（2026-10-26），但与你校 MySQL 版本可能有细微差异
- 课程、学生规模、研究问题：`user_confirmed（本次已确认）`
