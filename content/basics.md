## 1. 怎样读数学符号

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

## 2. 集合

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

## 3. 函数与原像

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

## 4. 数列与极限

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

## 5. 上确界与下确界

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

## 7. 可数与不可数

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

## 8. 上极限与下极限

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
