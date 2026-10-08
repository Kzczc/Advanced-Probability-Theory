/**
 * 讲次与练习合集的通用叫法：课件讲次按「第 N 讲 · 第几页」组织，作业与小测按「作业 1 · 第几题」组织。
 * topics.yaml 里 group: exercise 的条目是练习合集。
 */

/** 作业、小测这类按题目组织的合集 */
export function isExerciseCollection(topic) {
  return topic.group === "exercise";
}

/** 合集的名字，例如「第 3 讲」「作业 1」「小测 2」 */
export function topicLabel(topic) {
  return topic.label || `第 ${topic.number} 讲`;
}

/** 合集里一个单位叫什么：课件按页，练习按题 */
export function unitName(topic) {
  return isExerciseCollection(topic) ? "题" : "页";
}
