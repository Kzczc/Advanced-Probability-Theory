## 1. 怎样读数学符号 {#notation}

这一节讲最基本的逻辑符号和字母。概率论专用的记号（$\E$、$\operatorname{Var}$、各种收敛箭头……）和英文缩写（a.s.、i.i.d.、DCT……）汇总在本页最后的[第 11 节「符号与缩写速查表」](#symbols)。

::: basics 逻辑符号
| 符号 | 读法 | 意思 | 例子 |
| --- | --- | --- | --- |
| $\forall$ | 对所有、任意 | 后面的话对每一个对象都成立 | $\forall x\in\R,\ x^2\ge0$：每个实数的平方都非负 |
| $\exists$ | 存在 | 至少有一个对象让后面的话成立 | $\exists x\in\R,\ x^2=2$：有一个实数的平方是 2 |
| $\Rightarrow$ | 推出、蕴含 | 左边成立，右边一定成立 | $x>2\Rightarrow x>1$ |
| $\iff$ | 当且仅当（iff） | 两边同真同假 | $x^2=4\iff x=2$ 或 $x=-2$ |
| $:=$ | 定义为 | 左边是新起的名字 | $f(x):=x^2$ |
| s.t. | such that，使得 | 引出条件 | $\exists N$ s.t. $n\ge N$ 时 …… |
| $\equiv$ | 恒等于 | 对所有输入都相等 | $g\equiv1$：$g$ 处处等于 1 |
:::

::: warn 读「∀ ∃」句子的诀窍
**顺序很重要。**「$\forall\eps>0\ \exists N$」是「先给你任意一个 $\eps$，你再去找 $N$」——$N$ 可以依赖 $\eps$。反过来「$\exists N\ \forall\eps$」是「一个 $N$ 对所有 $\eps$ 都管用」，要求强得多。读的时候从左往右，把它想成一场游戏：$\forall$ 是对手出招，$\exists$ 是你应招。
:::

::: basics 本课常见的希腊字母
| 大写 | 小写 | 读法 | 本课里通常表示 |
| --- | --- | --- | --- |
| $\Omega$ | $\omega$ | omega（欧米伽） | 样本空间 / 样本点 |
| $\Sigma$ | $\sigma$ | sigma（西格玛） | 求和号 / σ-代数 |
| | $\mu$ | mu（缪） | 测度 |
| | $\lambda$ | lambda（兰布达） | 勒贝格测度、参数 |
| | $\eps$ | epsilon（艾普西隆） | 任意小的正数 |
| | $\delta$ | delta（德尔塔） | 小正数、点质量 $\delta_0$ |
| $\Phi$ | $\varphi$ | phi（斐） | 正态分布函数 / 函数 |
| | $\xi$ | xi（克西） | 随机变量 |
| | $\alpha,\beta$ | alpha、beta | 常数 |
:::

还有几种字体：$\R$（黑板粗体 R，实数全体）、$\N$（自然数 $1,2,3,\dots$）、$\Q$（有理数）、$\Z$（整数）；花体 $\F,\mathcal M,\mathcal B$ 通常表示「集合族」（例如 σ-代数）。

## 2. 集合 {#sets}

::: basics 元素与子集
- $a\in A$：$a$ 属于 $A$；$a\notin A$：不属于。
- $A\subseteq B$：$A$ 的**每个**元素都在 $B$ 里。要证明 $A\subseteq B$，就任取 $a\in A$，证明 $a\in B$。
- $A=B$ 的意思是 $A\subseteq B$ 且 $B\subseteq A$。这是证明两个集合相等的标准办法（「双向包含」）。
- 空集 $\varnothing$：没有元素。它是任何集合的子集。
:::

::: basics 集合的写法
- 列举法：$\{1,2,3\}$。元素没有顺序、不重复：$\{1,2\}=\{2,1\}=\{1,1,2\}$。
- 描述法：$\{x\in\R : x^2<4\}=(-2,2)$。冒号读作「使得」。
- 区间：$[a,b]=\{x:a\le x\le b\}$（含端点），$(a,b)$ 不含端点，$[a,b)$ 含左不含右。$(0,\infty)$ 是全体正实数。
:::

::: basics 并、交、补、差
设 $A,B\subseteq\Omega$：

$$
\begin{aligned}
A\cup B&=\{\omega:\omega\in A\text{ 或 }\omega\in B\}, &
A\cap B&=\{\omega:\omega\in A\text{ 且 }\omega\in B\},\\
A^c&=\{\omega\in\Omega:\omega\notin A\}, &
A\setminus B&=A\cap B^c .
\end{aligned}
$$

无穷多个集合也一样：

$$
\bigcup_{n=1}^{\infty}A_n=\{\omega:\ \text{至少有一个 }n\text{ 使 }\omega\in A_n\},\qquad
\bigcap_{n=1}^{\infty}A_n=\{\omega:\ \text{对所有 }n\text{ 都有 }\omega\in A_n\}.
$$
:::

::: ex 例：无穷并与无穷交
令 $A_n=[0,1-\tfrac1n]$。$A_1=\{0\}$，$A_2=[0,\tfrac12]$，$A_3=[0,\tfrac23]$，…… 越来越大。

- $\bigcup_nA_n=[0,1)$：任何 $x<1$ 迟早落进某个 $A_n$（取 $n>1/(1-x)$），但 $x=1$ 永远进不去。
- 令 $B_n=(0,\tfrac1n)$，越来越小。$\bigcap_nB_n=\varnothing$：任何 $x>0$，只要 $n>1/x$ 就有 $x\notin B_n$。
:::

::: basics 德摩根律
$$
\Big(\bigcup_nA_n\Big)^c=\bigcap_nA_n^c,\qquad \Big(\bigcap_nA_n\Big)^c=\bigcup_nA_n^c .
$$

人话：「不是（至少一个发生）」＝「一个都不发生」；「不是（全都发生）」＝「至少一个不发生」。它让我们可以在「并」和「交」之间来回转换，σ-代数的定义里只要求对并封闭，就是靠它推出对交也封闭。
:::

::: basics 集合族与幂集
- 集合族：元素是集合的集合，例如 $\{\varnothing,\{1\},\{1,2\}\}$。
- 幂集 $2^{\Omega}$：$\Omega$ 的**全部**子集。$\Omega=\{1,2\}$ 时，$2^\Omega=\{\varnothing,\{1\},\{2\},\{1,2\}\}$，共 $2^2=4$ 个。
- 三层要分清：$\omega\in A$（点属于集合），$A\in\F$（集合属于集合族），$A\subseteq\Omega$（集合包含于集合）。
:::

## 3. 函数与原像 {#functions}

::: basics 函数
$f:A\to B$：给 $A$ 中**每个**元素指定 $B$ 中**唯一**一个元素 $f(a)$。$A$ 叫定义域，$B$ 叫陪域。

- 像：$f(E)=\{f(a):a\in E\}$，把 $E$ 里的点都送过去得到的集合。
- **原像**：$f^{-1}(D)=\{a\in A: f(a)\in D\}$，「所有被送进 $D$ 的输入」。注意：原像**不需要** $f$ 有反函数，$f^{-1}(D)$ 只是一个集合的名字。
:::

::: ex 例：原像
$f(x)=x^2$，$A=\R$。

- $f^{-1}([0,4])=\{x:x^2\le4\}=[-2,2]$；
- $f^{-1}(\{9\})=\{-3,3\}$；
- $f^{-1}((-\infty,0))=\varnothing$（没有实数的平方是负数）。

概率里最常见的写法 $\{X\le x\}$ 就是原像：$\{X\le x\}=X^{-1}((-\infty,x])=\{\omega:X(\omega)\le x\}$。
:::

::: basics 原像保持所有集合运算（测度论最常用的性质）
$$
f^{-1}\Big(\bigcup_nD_n\Big)=\bigcup_nf^{-1}(D_n),\qquad
f^{-1}\Big(\bigcap_nD_n\Big)=\bigcap_nf^{-1}(D_n),\qquad
f^{-1}(D^c)=\big(f^{-1}(D)\big)^c .
$$

理由（以并为例）：$a\in f^{-1}(\bigcup D_n)\iff f(a)\in\bigcup D_n\iff$ 存在 $n$ 使 $f(a)\in D_n\iff$ 存在 $n$ 使 $a\in f^{-1}(D_n)$。正因为这个性质，「可测函数」和「分布」的定义才顺理成章。
:::

::: basics 示性函数
$$
\ind_A(x)=\begin{cases}1,&x\in A,\\0,&x\notin A.\end{cases}
$$

它把「集合」变成「函数」：$\ind_{A\cap B}=\ind_A\ind_B$，$\ind_{A^c}=1-\ind_A$；$A,B$ 不相交时 $\ind_{A\cup B}=\ind_A+\ind_B$。在概率里，$\E[\ind_A]=\P(A)$。
:::

## 4. 数列与极限 {#limits}

::: basics 极限的定义（慢慢读）
$a_n\to a$（读作「$a_n$ 收敛到 $a$」）的意思是：

$$
\forall\eps>0,\ \exists N,\ \text{使得}\ n\ge N\ \text{时}\ |a_n-a|<\eps .
$$

逐字翻译：**不管你要求多近**（任意 $\eps$），**总能找到一个位置 $N$**，**从这以后所有项**都离 $a$ 不超过 $\eps$。
:::

::: ex 例：证明 1/n → 0
给定 $\eps>0$。要让 $|1/n-0|<\eps$，只要 $n>1/\eps$。所以取 $N$ 为大于 $1/\eps$ 的整数，$n\ge N$ 时就有 $1/n\le1/N<\eps$。比如 $\eps=0.01$ 时取 $N=101$。
:::

::: basics 单调数列与无穷
- 递增（不减）：$a_1\le a_2\le\cdots$，记作 $a_n\uparrow$；递减记作 $a_n\downarrow$。
- **单调收敛原理**：递增的数列要么有上界并收敛到它的上确界，要么趋于 $+\infty$。所以递增数列**总有极限**（可能是 $\infty$）。测度的连续性、MCT 都建立在这一点上。
- 扩展实数 $[-\infty,\infty]$：允许取值 $\pm\infty$。约定 $a+\infty=\infty$（$a>-\infty$），$c\cdot\infty=\infty$（$c>0$），以及测度论专用的 $0\cdot\infty=0$。但 $\infty-\infty$ **没有定义**。
:::

## 5. 上确界与下确界 {#sup-inf}

::: basics sup 和 inf
- 集合 $E\subseteq\R$ 的**上界**：大于等于 $E$ 中所有元素的数。**上确界** $\sup E$：最小的上界。
- **下确界** $\inf E$：最大的下界。
- 和最大值 $\max$ 的区别：最大值必须**属于**集合，上确界不必。
:::

::: ex 例：sup 不一定取得到
- $E=(0,1)$：没有最大值（任何 $x<1$ 都还有更大的 $\frac{x+1}2<1$），但 $\sup E=1$；也没有最小值，$\inf E=0$。
- $E=\{1-\tfrac1n:n\ge1\}=\{0,\tfrac12,\tfrac23,\dots\}$：$\sup E=1$（不属于 $E$），$\min E=\inf E=0$。
- 约定：没有上界时 $\sup E=+\infty$。
:::

::: basics 最常用的两个性质
1. 若 $s=\sup E$ 有限，则对任意 $\eps>0$，存在 $x\in E$ 使 $x>s-\eps$（「上确界可以被无限逼近」）。
2. 若 $E\subseteq F$，则 $\sup E\le\sup F$，$\inf E\ge\inf F$（集合越大，上确界越大、下确界越小）。外测度、勒贝格积分的定义都用到这两点。
:::

## 6. 求和与级数

::: basics 求和号
$\sum_{k=1}^{n}a_k=a_1+a_2+\cdots+a_n$。无穷级数 $\sum_{k=1}^{\infty}a_k$ 定义为部分和 $S_n=\sum_{k=1}^na_k$ 的极限。
:::

::: ex 例：三个必须记住的级数
- **几何级数**：$\sum_{n=1}^{\infty}\frac{1}{2^n}=\frac12+\frac14+\frac18+\cdots=1$。它给出测度论里常用的「$\eps/2^n$ 技巧」：想让可数个量的总和不超过 $\eps$，就让第 $n$ 个不超过 $\eps/2^n$。
- **调和级数**：$\sum_{n=1}^{\infty}\frac1n=\infty$（发散），尽管每一项都趋于 0。
- $\sum_{n=1}^{\infty}\frac1{n^2}=\frac{\pi^2}{6}<\infty$（收敛）。
:::

::: basics 非负项级数：可以随便重排
每一项都 $\ge0$ 时，部分和递增，所以级数总有值（可能是 $\infty$），而且**任意重新排列、分组**都不改变这个值。可数可加性里的 $\sum_n\mu(A_n)$ 都是非负项级数，所以不用担心求和顺序。
:::

## 7. 可数与不可数 {#countable}

::: basics 定义
集合是**可数的**，如果它的元素能排成一列 $x_1,x_2,x_3,\dots$（有限集合也算可数）。排不成一列的无穷集合叫**不可数**。
:::

::: ex 例：有理数可数，实数不可数
- 整数可数：$0,1,-1,2,-2,3,-3,\dots$
- 有理数可数：把分数 $p/q$ 按 $|p|+q=2,3,4,\dots$ 分组，每组只有有限个，一组一组往下排，就把所有有理数排成了一列。
- $[0,1]$ 不可数（康托尔对角线法）：假设能排成一列 $x_1,x_2,\dots$，写出它们的小数展开，构造一个数，让它第 $n$ 位小数和 $x_n$ 的第 $n$ 位不同，那么它和列表里每一个数都不同，矛盾。
:::

::: idea 为什么测度论这么在乎「可数」
测度只要求**可数**可加：可数个不相交集合，测度可以相加。对不可数多个集合不要求（也做不到：$[0,1]$ 是不可数个单点的并，每个单点长度 0，总长却是 1）。所以「可数」是测度论里「能相加」和「不能相加」的分界线。
:::

## 8. 上极限与下极限 {#limsup}

::: basics 数列的 lim sup 与 lim inf
$$
\limsup_{n\to\infty}a_n=\inf_{N\ge1}\ \sup_{n\ge N}a_n,\qquad
\liminf_{n\to\infty}a_n=\sup_{N\ge1}\ \inf_{n\ge N}a_n .
$$

先看「从第 $N$ 项往后的尾巴」的最大可能值 $\sup_{n\ge N}a_n$，它随 $N$ 增大而减小；它的极限就是上极限。下极限同理。**数列收敛当且仅当上下极限相等**。
:::

::: ex 例：a_n = (−1)^n
尾巴里永远既有 1 也有 $-1$，所以每个 $\sup_{n\ge N}a_n=1$，每个 $\inf_{n\ge N}a_n=-1$。于是 $\limsup a_n=1$，$\liminf a_n=-1$，不相等，数列不收敛。
:::

::: basics 集合的 lim sup 与 lim inf
$$
\limsup_nA_n=\bigcap_{N\ge1}\bigcup_{n\ge N}A_n=\{\omega:\ \omega\text{ 属于无穷多个 }A_n\},
$$

$$
\liminf_nA_n=\bigcup_{N\ge1}\bigcap_{n\ge N}A_n=\{\omega:\ \text{从某个 }N\text{ 起，}\omega\text{ 属于所有 }A_n\}.
$$

读法：$\bigcap_N\bigcup_{n\ge N}$ 是「对每个 $N$，都存在 $n\ge N$」——不管从多靠后开始数，后面总还会再发生，也就是**发生无穷多次**。$\bigcup_N\bigcap_{n\ge N}$ 是「存在 $N$，对所有 $n\ge N$」——**从某一刻起一直发生**。详见第 1 讲 [[p:7]]、[[p:40]]。
:::

## 9. 积分回顾

::: basics 定积分的直观
$\int_a^bf(x)\dd x$：函数图像与 $x$ 轴之间的（带符号）面积。黎曼的做法：把 $[a,b]$ 切成小段，每段用「长度 × 函数值」近似，再让小段越来越细取极限。
:::

::: basics 本课常用的积分
$$
\int_0^1x^n\dd x=\frac1{n+1},\qquad
\int_0^\infty e^{-\lambda x}\dd x=\frac1\lambda\ (\lambda>0),\qquad
\int_0^1x^{-\alpha}\dd x=\begin{cases}\dfrac{1}{1-\alpha},&\alpha<1,\\[4pt] \infty,&\alpha\ge1.\end{cases}
$$

最后一个说明：函数在 0 附近无界，积分也可能有限（$\alpha<1$ 时），这在第 3 讲的重要性抽样里会用到。
:::

## 10. 怎样读定义和定理

::: idea 三个习惯
1. **先分清假设和结论。**「若 A，则 B」中，A 是假设，B 是结论。把假设逐条列出来。
2. **问每个假设为什么在那里。**试着去掉它，找一个反例看结论怎样失败。课件里的反例（尖峰、$[n,\infty)$、狄利克雷函数……）就是在做这件事。
3. **定理是充分条件，不是必要条件。**假设不满足时，结论**可能**仍然成立，只是这个定理不能保证。
:::

::: ex 例：读「从上连续」
「若 $E_n\downarrow E$ 且 $\mu(E_1)<\infty$，则 $\mu(E_n)\to\mu(E)$。」

- 假设 1：集合一层层变小；假设 2：第一个集合的测度有限。
- 去掉假设 2：$E_n=[n,\infty)$，每个测度都是 $\infty$，交集是空集，测度为 0，结论失败。
- 所以假设 2 不是多余的——这正是第 1 讲 [[p:14]] 标题里「necessary hypothesis（必要的假设）」的意思。
:::

## 11. 符号与缩写速查表 {#symbols}

读讲义时遇到不认识的记号，先在这里查。每行最后一列是正式讲它的地方，点进去有完整的解释和例子；写「基础补课第 N 节」的，就在本页上面。

在任何一页点顶栏的「符号」按钮，也能不离开当前页查这张表，还可以输入关键词筛选。中文术语（例如「可测函数」「一致可积」）请查[术语表](glossary.html)。

::: basics 概率、期望与分布
| 记号 | 读法 | 意思 | 在哪里讲 |
| --- | --- | --- | --- |
| $(\Omega,\F,\P)$ | 概率空间 | 样本空间 $\Omega$、事件全体 $\F$（一个 σ-代数）、概率 $\P$ 三样东西放在一起 | 第 1 讲 [[t1:p:12]] |
| $\P(A)$ | A 的概率 | 事件 $A$ 发生的可能性，$0\le\P(A)\le1$ | 第 1 讲 [[t1:p:12]] |
| $\P(A\mid B)$ | 给定 B 时 A 的条件概率 | 已知 $B$ 发生，$A$ 发生的概率：$\P(A\cap B)/\P(B)$（要求 $\P(B)>0$） | — |
| $\E X$、$\E[X]$ | X 的期望 | $X$ 的加权平均 $\int X\dd\P$；掷一颗骰子的点数，期望是 $3.5$ | 第 2 讲 [[t2:p:5]] |
| $\operatorname{Var}X$ | X 的方差 | $\E(X-\E X)^2$：偏离均值的平方的平均，衡量波动大小；它的平方根叫标准差 | 第 2 讲 [[t2:p:29]] |
| $\operatorname{Cov}(X,Y)$ | X 与 Y 的协方差 | $\E[(X-\E X)(Y-\E Y)]$：两个量是否倾向于「同时偏大、同时偏小」 | 第 4 讲 [[t4:p:4]] |
| $\ind_A$、$\ind\{X>t\}$ | A 的示性函数 | 在 $A$ 上取 1，其余地方取 0；所以 $\E\ind_A=\P(A)$ | 第 1 讲 [[t1:p:30]] |
| $\mathcal L(X)$、$\mu_X$ | X 的分布 | $X$ 落进各个集合的概率：$\mathcal L(X)(B)=\P(X\in B)$ | 第 2 讲 [[t2:p:6]] |
| $X\sim N(0,1)$ | X 服从标准正态分布 | 「$\sim$」读作「服从」，后面写分布的名字，例如 $X\sim\exp(\lambda)$ 是指数分布 | 第 2 讲 [[t2:p:6]] |
| $X\overset{d}{=}Y$ | X 与 Y 同分布 | 分布相同；$X$ 和 $Y$ 本身可以不相等（例如 $Z$ 与 $-Z$，$Z\sim N(0,1)$） | 第 2 讲 [[t2:p:6]] |
| $F(x)=\P(X\le x)$ | 分布函数（CDF） | 不超过 $x$ 的概率；单调不减、右连续 | 第 2 讲 [[t2:p:8]] |
| $F(x-)$ | F 在 x 处的左极限 | 从左边逼近 $x$ 时 $F$ 的极限；跳跃 $F(x)-F(x-)=\P(X=x)$ | 第 2 讲 [[t2:p:8]] |
| $\delta_a$ | a 处的点质量 | 把全部质量放在一个点 $a$ 上：$a\in E$ 时 $\delta_a(E)=1$，否则为 0 | 第 1 讲 [[t1:p:10]] |
:::

::: basics 测度、积分与 σ-代数
| 记号 | 读法 | 意思 | 在哪里讲 |
| --- | --- | --- | --- |
| $\F$、$\mathcal M$、$\mathcal B$ | 花体 F、M、B | 集合族，通常是 σ-代数；$\mathcal B$ 常指博雷尔 σ-代数 | 第 1 讲 [[t1:p:9]] |
| $\sigma(\mathcal A)$ | 由 𝒜 生成的 σ-代数 | 包含 $\mathcal A$ 的最小 σ-代数 | 第 1 讲 [[t1:p:11]] |
| $\sigma(X)$ | X 生成的 σ-代数 | 所有形如 $\{X\in B\}$ 的事件，也就是「知道 $X$ 的值就能判断是否发生」的事件 | 第 4 讲 [[t4:p:16]] |
| $\mu(A)$ | A 的测度 | 集合 $A$ 的「大小」：长度、面积、个数或概率 | 第 1 讲 [[t1:p:12]] |
| $\Leb$ | 勒贝格测度 | 实数轴上的「长度」：$\Leb([a,b])=b-a$ | 第 1 讲 [[t1:p:23]] |
| $\int f\dd\mu$ | f 对 μ 的积分 | 把 $f$ 的值按 $\mu$ 加权求和；$\mu=\P$ 时就是期望 $\E f$ | 第 1 讲 [[t1:p:33]] |
| $f^+$、$f^-$ | f 的正部、负部 | $f^+=\max(f,0)$，$f^-=\max(-f,0)$，于是 $f=f^+-f^-$，$\lvert f\rvert=f^++f^-$ | 第 1 讲 [[t1:p:33]] |
| $L^1$、$L^p$ | L1 空间、Lp 空间 | 满足 $\int\lvert f\rvert^p\dd\mu<\infty$ 的函数（随机变量）全体 | 第 2 讲 [[t2:p:22]] |
| $\lVert X\rVert_p$ | X 的 Lp 范数 | $(\E\lvert X\rvert^p)^{1/p}$，衡量 $X$ 有多「大」 | 第 2 讲 [[t2:p:22]] |
| $\nu\ll\mu$ | ν 关于 μ 绝对连续 | 凡是 $\mu(A)=0$ 的集合，都有 $\nu(A)=0$ | 第 3 讲 [[t3:p:26]] |
| $\dfrac{\mathrm d\nu}{\mathrm d\mu}$ | Radon–Nikodym 导数 | $\nu$ 相对于 $\mu$ 的「密度」：$\nu(A)=\int_A\frac{\mathrm d\nu}{\mathrm d\mu}\dd\mu$ | 第 3 讲 [[t3:p:27]] |
| $\F_1\otimes\F_2$、$\mu_1\otimes\mu_2$ | 乘积 σ-代数、乘积测度 | 两个空间拼成一个联合空间；矩形 $A\times B$ 的测度是 $\mu_1(A)\mu_2(B)$ | 第 4 讲 [[t4:p:7]] |
| $\iint f\dd x\dd y$ | 二重积分 | 对两个变量一起积分；Fubini 定理说明何时可以拆成两次单重积分 | 第 4 讲 [[t4:p:10]] |
:::

::: basics 收敛的几种写法
| 记号 | 读法 | 意思 | 在哪里讲 |
| --- | --- | --- | --- |
| $a_n\to a$ | a_n 趋于 a | 数列的极限，和 $\lim_{n\to\infty}a_n=a$ 是一个意思 | [基础补课第 4 节](basics.html#limits) |
| $f_n\uparrow f$、$A_n\uparrow A$ | 递增地趋于 | $f_1\le f_2\le\cdots$ 且 $f_n\to f$；集合版：$A_1\subseteq A_2\subseteq\cdots$，$A=\bigcup_nA_n$ | 第 1 讲 [[t1:p:13]] |
| $f_n\downarrow f$、$A_n\downarrow A$ | 递减地趋于 | 方向反过来；集合版：$A_1\supseteq A_2\supseteq\cdots$，$A=\bigcap_nA_n$ | 第 1 讲 [[t1:p:14]] |
| $X_n\to X$ a.s. | 几乎必然收敛 | 除了一个概率为 0 的事件，每个结局上都有 $X_n(\omega)\to X(\omega)$ | 第 3 讲 [[t3:p:9]] |
| $f_n\to f$ a.e. | 几乎处处收敛 | 除了一个测度为 0 的集合，每个点上都有 $f_n(x)\to f(x)$ | 第 1 讲 [[t1:p:43]] |
| $X_n\xrightarrow{\P}X$ | 依概率收敛 | 对每个 $\eps>0$，$\P(\lvert X_n-X\rvert>\eps)\to0$；原解答里也写成 $\xrightarrow{p}$ | 第 3 讲 [[t3:p:14]] |
| $X_n\to X$ 在 $L^p$ 中 | Lp 收敛 | $\E\lvert X_n-X\rvert^p\to0$，即 $\lVert X_n-X\rVert_p\to0$ | [[hw2:p:1]] |
| $U_n\Rightarrow U$ | 依分布收敛 | 分布函数在极限分布的每个连续点上收敛。只在作业 2 里这样用；其他地方的 $\Rightarrow$ 都是「推出」 | [[hw2:p:4]] |
| $A_n$ i.o. | A_n 发生无穷多次 | 有无穷多个 $n$ 使 $A_n$ 发生，也就是集合 $\limsup_nA_n$ | 第 3 讲 [[t3:p:3]] |
| $\limsup$、$\liminf$ | 上极限、下极限 | 数列「尾部」最终能达到的最大值、最小值 | [基础补课第 8 节](basics.html#limsup)、第 1 讲 [[t1:p:40]] |
:::

::: basics 运算与常用小记号
| 记号 | 读法 | 意思 | 在哪里讲 |
| --- | --- | --- | --- |
| $\sup A$、$\inf A$ | 上确界、下确界 | 最小的上界、最大的下界 | [基础补课第 5 节](basics.html#sup-inf)、第 1 讲 [[t1:p:16]] |
| $x\wedge y$、$x\vee y$ | x 与 y 取小、取大 | $\min(x,y)$、$\max(x,y)$；例如 $f\wedge n$ 把 $f$ 超过 $n$ 的部分削成 $n$ | 第 1 讲 [[t1:p:33]] |
| $\lfloor x\rfloor$、$\lceil x\rceil$ | 向下取整、向上取整 | 不超过 $x$ 的最大整数、不小于 $x$ 的最小整数：$\lfloor2.7\rfloor=2$，$\lceil2.1\rceil=3$ | 第 1 讲 [[t1:p:34]] |
| $\prod_{i=1}^na_i$ | 连乘 | $a_1a_2\cdots a_n$；和 $\sum$ 一样，只是把「加」换成「乘」 | — |
| $\binom nk$ | n 选 k（组合数） | 从 $n$ 个东西里选 $k$ 个的方法数 $\frac{n!}{k!\,(n-k)!}$，例如 $\binom42=6$ | — |
| $e^x$、$\exp(x)$ | e 的 x 次方 | 指数函数，两种写法是一个意思；$e\approx2.718$ | — |
| $\ln x$、$\log x$ | 自然对数 | 以 $e$ 为底，是 $e^x$ 的反函数；本课的 $\log$ 也是自然对数，写成 $\log_2$ 才是以 2 为底 | — |
| $x\mapsto f(x)$ | x 映射到 f(x) | 描述函数的规则：$x\mapsto x^2$ 就是「把 $x$ 变成 $x^2$」的那个函数 | [基础补课第 3 节](basics.html#functions) |
| $x^T$、$A^T$ | 转置 | 把行和列互换；列向量 $x$ 的 $x^T\Sigma x$ 是一个数 | 第 4 讲 [[t4:p:19]] |
| $\det\Sigma$ | 行列式 | 2×2 矩阵时 $\det\begin{pmatrix}a&b\\c&d\end{pmatrix}=ad-bc$ | 第 4 讲 [[t4:p:19]] |
| $a\approx b$ | 约等于 | 数值上近似相等，例如 $\sqrt2\approx1.414$ | — |
| $g\propto h$ | 正比于 | 存在常数 $c$ 使 $g=ch$ | — |
| $o(b_n)$、$O(b_n)$ | 小 o、大 O | $a_n=o(b_n)$：$a_n/b_n\to0$，比 $b_n$ 小得多；$a_n=O(b_n)$：$\lvert a_n/b_n\rvert$ 有界，至多和 $b_n$ 同一量级 | — |
| $\blacksquare$ | 证毕 | 证明到此结束 | — |
| $:=$、$\equiv$ | 定义为、恒等于 | $f(x):=x^2$ 是给 $x^2$ 起名叫 $f(x)$；$g\equiv1$ 是说 $g$ 处处等于 1 | [基础补课第 1 节](basics.html#notation) |
:::

::: basics 常见英文缩写
| 缩写 | 英文全称 | 中文意思 | 在哪里讲 |
| --- | --- | --- | --- |
| a.s. | almost surely | 几乎必然：除了概率为 0 的情形，都成立 | 第 3 讲 [[t3:p:9]] |
| a.e. | almost everywhere | 几乎处处：除了测度为 0 的集合，都成立 | 第 1 讲 [[t1:p:43]] |
| i.i.d. | independent and identically distributed | 独立同分布 | 第 4 讲 [[t4:p:16]] |
| i.o. | infinitely often | 无穷多次 | 第 3 讲 [[t3:p:3]] |
| iff | if and only if | 当且仅当 | [基础补课第 1 节](basics.html#notation) |
| s.t. | such that | 使得 | [基础补课第 1 节](basics.html#notation) |
| CDF | cumulative distribution function | 累积分布函数 $F(x)=\P(X\le x)$ | 第 2 讲 [[t2:p:8]] |
| LOTUS | law of the unconscious statistician | 无意识统计学家定律：$\E g(X)$ 可以直接对 $X$ 的分布积分 | 第 2 讲 [[t2:p:7]] |
| MCT | monotone convergence theorem | 单调收敛定理 | 第 1 讲 [[t1:p:36]] |
| DCT | dominated convergence theorem | 控制收敛定理 | 第 1 讲 [[t1:p:44]] |
| BCT | bounded convergence theorem | 有界收敛定理 | 第 1 讲 [[t1:p:46]] |
| WLLN | weak law of large numbers | 弱大数定律 | 第 2 讲 [[t2:p:29]] |
| SLLN | strong law of large numbers | 强大数定律 | [[hw1:p:3]] |
| CLT | central limit theorem | 中心极限定理 | [[hw2:p:4]] |
| UI | uniformly integrable | 一致可积 | [[quiz2:p:2]] |
:::
