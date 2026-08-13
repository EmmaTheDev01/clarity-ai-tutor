# KaTeX & LaTeX Formatting Reference Sheet

A comprehensive cheat sheet for mathematical notation, LaTeX symbols, formatting commands, and matrices.

---

## 1. Syntax Basics & Delimiters

* **Inline Math:** Enclose the expression in single dollar signs `$ ... $`.  
  * *Example:* `$E = mc^2$` renders as $E = mc^2$.
* **Display / Block Math:** Enclose the expression in double dollar signs `$$ ... $$` on its own line.  
  * *Example:*
    ```latex
    $$
    \int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
    $$
    ```

---

## 2. Arithmetic & Basic Operators

| Description | LaTeX Command | Rendered Output |
| :--- | :--- | :--- |
| Fraction | `\frac{a}{b}` | $\frac{a}{b}$ |
| Large Fraction | `\dfrac{a}{b}` | $\dfrac{a}{b}$ |
| Subscript | `x_i` | $x_i$ |
| Superscript / Exponent | `x^2` | $x^2$ |
| Combined Sub/Superscript | `x_{i}^{2}` | $x_{i}^{2}$ |
| Square Root | `\sqrt{x}` | $\sqrt{x}$ |
| $N$-th Root | `\sqrt[n]{x}` | $\sqrt[n]{x}$ |
| Multiplication (Cross) | `a \times b` | $a \times b$ |
| Multiplication (Dot) | `a \cdot b` | $a \cdot b$ |
| Division | `a \div b` | $a \div b$ |
| Plus-Minus | `a \pm b` | $a \pm b$ |

---

## 3. Relational Operators

| Symbol | LaTeX Command |
| :--- | :--- |
| Equals / Not Equals | `=` , `\neq` ($\neq$) |
| Less Than / Greater Than | `<` , `>` |
| Less/Greater Than or Equal | `\le` ($\le$) , `\ge` ($\ge$) |
| Approximately Equal | `\approx` ($\approx$) |
| Proportional To | `\propto` ($\propto$) |
| Equivalent To | `\equiv` ($\equiv$) |
| Tends To | `\to` ($\to$) |

---

## 4. Calculus & Higher Mathematics

### Limits, Integrals & Series

```latex
% Limit
\lim_{x \to 0} \frac{\sin x}{x} = 1

% Definite Integral
\int_{a}^{b} f(x) \, dx

% Double / Triple Integral
\iint_{D} f(x, y) \, dx\,dy \quad \iiint_{V} f(x, y, z) \, dV

% Summation
\sum_{k=1}^{n} k^2 = \frac{n(n+1)(2n+1)}{6}

% Product
\prod_{i=1}^{n} x_i
```

### Derivatives

* First derivative: `\frac{df}{dx}` or `f'(x)`
* Second derivative: `\frac{d^2f}{dx^2}` or `f''(x)`
* Partial derivative: `\frac{\partial f}{\partial x}`

---

## 5. Greek Alphabet

### Lowercase

| Symbol | Command | Symbol | Command |
| :---: | :--- | :---: | :--- |
| $\alpha$ | `\alpha` | $\nu$ | `\nu` |
| $\beta$ | `\beta` | $\xi$ | `\xi` |
| $\gamma$ | `\gamma` | $\pi$ | `\pi` |
| $\delta$ | `\delta` | $\rho$ | `\rho` |
| $\epsilon$ | `\epsilon` / `\varepsilon` | $\sigma$ | `\sigma` |
| $\zeta$ | `\zeta` | $\tau$ | `\tau` |
| $\eta$ | `\eta` | $\phi$ | `\phi` / `\varphi` |
| $\theta$ | `\theta` | $\chi$ | `\chi` |
| $\iota$ | `\iota` | $\psi$ | `\psi` |
| $\kappa$ | `\kappa` | $\omega$ | `\omega` |
| $\lambda$ | `\lambda` | $\mu$ | `\mu` |

### Uppercase

| Symbol | Command | Symbol | Command |
| :---: | :--- | :---: | :--- |
| $\Gamma$ | `\Gamma` | $\Sigma$ | `\Sigma` |
| $\Delta$ | `\Delta` | $\Upsilon$ | `\Upsilon` |
| $\Theta$ | `\Theta` | $\Phi$ | `\Phi` |
| $\Lambda$ | `\Lambda` | $\Psi$ | `\Psi` |
| $\Xi$ | `\Xi` | $\Omega$ | `\Omega` |

---

## 6. Matrices & Environments

### Standard Brackets Matrix (`bmatrix`)
```latex
$$
\begin{bmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
7 & 8 & 9
\end{bmatrix}
$$
```

### Parentheses Matrix (`pmatrix`)
```latex
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$
```

### Determinant / Vertical Bars (`vmatrix`)
```latex
$$
\begin{vmatrix}
x & y \\
z & w
\end{vmatrix}
$$
```

### Piecewise Functions (`cases`)
```latex
$$
f(x) = 
\begin{cases} 
x^2 & \text{if } x \ge 0 \\
-x & \text{if } x < 0 
\end{cases}
$$
```

---

## 7. Font Styles & Accents

| Style | Command | Example Output |
| :--- | :--- | :--- |
| Bold Vector / Math | `\mathbf{v}` | $\mathbf{v}$ |
| Blackboard Bold (Sets) | `\mathbb{R}, \mathbb{N}, \mathbb{Z}` | $\mathbb{R}, \mathbb{N}, \mathbb{Z}$ |
| Calligraphic | `\mathcal{L}, \mathcal{O}` | $\mathcal{L}, \mathcal{O}$ |
| Roman / Normal Text | `\text{where } x > 0` | $\text{where } x > 0$ |
| Hat / Vector Arrow | `\hat{x}, \vec{v}` | $\hat{x}, \vec{v}$ |
| Overline / Underline | `\overline{A}, \underline{B}` | $\overline{A}, \underline{B}$ |


DerivativesFirst derivative: \frac{df}{dx} or f'(x)Second derivative: \frac{d^2f}{dx^2} or f''(x)Partial derivative: \frac{\partial f}{\partial x}5. Greek AlphabetLowercaseSymbolCommandSymbolCommand$\alpha$\alpha$\nu$\nu$\beta$\beta$\xi$\xi$\gamma$\gamma$\pi$\pi$\delta$\delta$\rho$\rho$\epsilon$\epsilon / \varepsilon$\sigma$\sigma$\zeta$\zeta$\tau$\tau$\eta$\eta$\phi$\phi / \varphi$\theta$\theta$\chi$\chi$\iota$\iota$\psi$\psi$\kappa$\kappa$\omega$\omega$\lambda$\lambda$\mu$\muUppercaseSymbolCommandSymbolCommand$\Gamma$\Gamma$\Sigma$\Sigma$\Delta$\Delta$\Upsilon$\Upsilon$\Theta$\Theta$\Phi$\Phi$\Lambda$\Lambda$\Psi$\Psi$\Xi$\Xi$\Omega$\Omega6. Matrices & EnvironmentsStandard Brackets Matrix (bmatrix)Code snippet$$\begin{bmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{bmatrix}$$
Parentheses Matrix (pmatrix)Code snippet$$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$$
Determinant / Vertical Bars (vmatrix)Code snippet$$\begin{vmatrix} x & y \\ z & w \end{vmatrix}$$
Piecewise Functions (cases)Code snippet$$f(x) =  \begin{cases}  x^2 & \text{if } x \ge 0 \\ -x & \text{if } x < 0  \end{cases}$$
7. Font Styles & AccentsStyleCommandExample OutputBold Vector / Math\mathbf{v}$\mathbf{v}$Blackboard Bold (Sets)\mathbb{R}, \mathbb{N}, \mathbb{Z}$\mathbb{R}, \mathbb{N}, \mathbb{Z}$Calligraphic\mathcal{L}, \mathcal{O}$\mathcal{L}, \mathcal{O}$Roman / Normal Text\text{where } x > 0$\text{where } x > 0$Hat / Vector Arrow\hat{x}, \vec{v}$\hat{x}, \vec{v}$Overline / Underline\overline{A}, \underline{B}$\overline{A}, \underline{B}$"""file_name = "KATEX_LATEX_REFERENCE.md"with open(file_name, "w", encoding="utf-8") as f:f.write(katex_md_content)print(f"File created successfully: {file_name}")
```text?code_stdout&code_event_index=1
Traceback (most recent call last):
  File "<xbox-string>", line 168
    katex_md_content = """# KaTeX & LaTeX Formatting Reference Sheet

A comprehensive cheat sheet for mathematical notation, LaTeX symbols, formatting commands, and matrices.

---

## 1. Syntax Basics & Delimiters

* **Inline Math:** Enclose the expression in single dollar signs `$ ... $`.  
  * *Example:* `$E = mc^2$` renders as $E = mc^2$.
* **Display / Block Math:** Enclose the expression in double dollar signs `$$ ... $$` on its own line.  
  * *Example:*
    ```latex
    $$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$
    ```

---

## 2. Arithmetic & Basic Operators

| Description | LaTeX Command | Rendered Output |
| :--- | :--- | :--- |
| Fraction | `\frac{a}{b}` | $\frac{a}{b}$ |
| Large Fraction | `\dfrac{a}{b}` | $\dfrac{a}{b}$ |
| Subscript | `x_i` | $x_i$ |
| Superscript / Exponent | `x^2` | $x^2$ |
| Combined Sub/Superscript | `x_{i}^{2}` | $x_{i}^{2}$ |
| Square Root | `\sqrt{x}` | $\sqrt{x}$ |
| $N$-th Root | `\sqrt[n]{x}` | $\sqrt[n]{x}$ |
| Multiplication (Cross) | `a \times b` | $a \times b$ |
| Multiplication (Dot) | `a \cdot b` | $a \cdot b$ |
| Division | `a \div b` | $a \div b$ |
| Plus-Minus | `a \pm b` | $a \pm b$ |

---

## 3. Relational Operators

| Symbol | LaTeX Command |
| :--- | :--- |
| Equals / Not Equals | `=` , `\neq` ($\neq$) |
| Less Than / Greater Than | `<` , `>` |
| Less/Greater Than or Equal | `\le` ($\le$) , `\ge` ($\ge$) |
| Approximately Equal | `\approx` ($\approx$) |
| Proportional To | `\propto` ($\propto$) |
| Equivalent To | `\equiv` ($\equiv$) |
| Tends To | `\to` ($\to$) |

---

## 4. Calculus & Higher Mathematics

### Limits, Integrals & Series

```latex
% Limit
\lim_{x \to 0} \frac{\sin x}{x} = 1

% Definite Integral
\int_{a}^{b} f(x) \, dx

% Double / Triple Integral
\iint_{D} f(x, y) \, dx\,dy \quad \iiint_{V} f(x, y, z) \, dV

% Summation
\sum_{k=1}^{n} k^2 = \frac{n(n+1)(2n+1)}{6}

% Product
\prod_{i=1}^{n} x_i
DerivativesFirst derivative: \frac{df}{dx} or f'(x)Second derivative: \frac{d^2f}{dx^2} or f''(x)Partial derivative: \frac{\partial f}{\partial x}5. Greek AlphabetLowercaseSymbolCommandSymbolCommand$\alpha$\alpha$\nu$\nu$\beta$\beta$\xi$\xi$\gamma$\gamma$\pi$\pi$\delta$\delta$\rho$\rho$\epsilon$\epsilon / \varepsilon$\sigma$\sigma$\zeta$\zeta$\tau$\tau$\eta$\eta$\phi$\phi / \varphi$\theta$\theta$\chi$\chi$\iota$\iota$\psi$\psi$\kappa$\kappa$\omega$\omega$\lambda$\lambda$\mu$\muUppercaseSymbolCommandSymbolCommand$\Gamma$\Gamma$\Sigma$\Sigma$\Delta$\Delta$\Upsilon$\Upsilon$\Theta$\Theta$\Phi$\Phi$\Lambda$\Lambda$\Psi$\Psi$\Xi$\Xi$\Omega$\Omega6. Matrices & EnvironmentsStandard Brackets Matrix (bmatrix)Code snippet$$\begin{bmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{bmatrix}$$
Parentheses Matrix (pmatrix)Code snippet$$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$$
Determinant / Vertical Bars (vmatrix)Code snippet$$\begin{vmatrix} x & y \\ z & w \end{vmatrix}$$
Piecewise Functions (cases)Code snippet$$f(x) =  \begin{cases}  x^2 & \text{if } x \ge 0 \\ -x & \text{if } x < 0  \end{cases}$$
7. Font Styles & AccentsStyleCommandExample OutputBold Vector / Math\mathbf{v}$\mathbf{v}$Blackboard Bold (Sets)\mathbb{R}, \mathbb{N}, \mathbb{Z}$\mathbb{R}, \mathbb{N}, \mathbb{Z}$Calligraphic\mathcal{L}, \mathcal{O}$\mathcal{L}, \mathcal{O}$Roman / Normal Text\text{where } x > 0$\text{where } x > 0$Hat / Vector Arrow\hat{x}, \vec{v}$\hat{x}, \vec{v}$Overline / Underline\overline{A}, \underline{B}$\overline{A}, \underline{B}$"""   ^
SyntaxError: (unicode error) 'unicodeescape' codec can't decode bytes in position 2242-2243: truncated \xXX escape


```python?code_reference&code_event_index=2
# Use raw string formatting or write content directly to avoid unicode escape errors
katex_md_content = r"""# KaTeX & LaTeX Formatting Reference Sheet

A comprehensive cheat sheet for mathematical notation, LaTeX symbols, formatting commands, and matrices.

---

## 1. Syntax Basics & Delimiters

* **Inline Math:** Enclose the expression in single dollar signs `$ ... $`.  
  * *Example:* `$E = mc^2$` renders as $E = mc^2$.
* **Display / Block Math:** Enclose the expression in double dollar signs `$$ ... $$` on its own line.  
  * *Example:*
    ```latex
    $$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$
    ```

---

## 2. Arithmetic & Basic Operators

| Description | LaTeX Command | Rendered Output |
| :--- | :--- | :--- |
| Fraction | `\frac{a}{b}` | $\frac{a}{b}$ |
| Large Fraction | `\dfrac{a}{b}` | $\dfrac{a}{b}$ |
| Subscript | `x_i` | $x_i$ |
| Superscript / Exponent | `x^2` | $x^2$ |
| Combined Sub/Superscript | `x_{i}^{2}` | $x_{i}^{2}$ |
| Square Root | `\sqrt{x}` | $\sqrt{x}$ |
| $N$-th Root | `\sqrt[n]{x}` | $\sqrt[n]{x}$ |
| Multiplication (Cross) | `a \times b` | $a \times b$ |
| Multiplication (Dot) | `a \cdot b` | $a \cdot b$ |
| Division | `a \div b` | $a \div b$ |
| Plus-Minus | `a \pm b` | $a \pm b$ |

---

## 3. Relational Operators

| Symbol | LaTeX Command |
| :--- | :--- |
| Equals / Not Equals | `=` , `\neq` ($\neq$) |
| Less Than / Greater Than | `<` , `>` |
| Less/Greater Than or Equal | `\le` ($\le$) , `\ge` ($\ge$) |
| Approximately Equal | `\approx` ($\approx$) |
| Proportional To | `\propto` ($\propto$) |
| Equivalent To | `\equiv` ($\equiv$) |
| Tends To | `\to` ($\to$) |

---

## 4. Calculus & Higher Mathematics

### Limits, Integrals & Series

```latex
% Limit
\lim_{x \to 0} \frac{\sin x}{x} = 1

% Definite Integral
\int_{a}^{b} f(x) \, dx

% Double / Triple Integral
\iint_{D} f(x, y) \, dx\,dy \quad \iiint_{V} f(x, y, z) \, dV

% Summation
\sum_{k=1}^{n} k^2 = \frac{n(n+1)(2n+1)}{6}

% Product
\prod_{i=1}^{n} x_i
DerivativesFirst derivative: \frac{df}{dx} or f'(x)Second derivative: \frac{d^2f}{dx^2} or f''(x)Partial derivative: \frac{\partial f}{\partial x}5. Greek AlphabetLowercaseSymbolCommandSymbolCommand$\alpha$\alpha$\nu$\nu$\beta$\beta$\xi$\xi$\gamma$\gamma$\pi$\pi$\delta$\delta$\rho$\rho$\epsilon$\epsilon / \varepsilon$\sigma$\sigma$\zeta$\zeta$\tau$\tau$\eta$\eta$\phi$\phi / \varphi$\theta$\theta$\chi$\chi$\iota$\iota$\psi$\psi$\kappa$\kappa$\omega$\omega$\lambda$\lambda$\mu$\muUppercaseSymbolCommandSymbolCommand$\Gamma$\Gamma$\Sigma$\Sigma$\Delta$\Delta$\Upsilon$\Upsilon$\Theta$\Theta$\Phi$\Phi$\Lambda$\Lambda$\Psi$\Psi$\Xi$\Xi$\Omega$\Omega6. Matrices & EnvironmentsStandard Brackets Matrix (bmatrix)Code snippet$$\begin{bmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{bmatrix}$$
Parentheses Matrix (pmatrix)Code snippet$$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$$
Determinant / Vertical Bars (vmatrix)Code snippet$$\begin{vmatrix} x & y \\ z & w \end{vmatrix}$$
Piecewise Functions (cases)Code snippet$$f(x) =  \begin{cases}  x^2 & \text{if } x \ge 0 \\ -x & \text{if } x < 0  \end{cases}$$
7. Font Styles & AccentsStyleCommandExample OutputBold Vector / Math\mathbf{v}$\mathbf{v}$Blackboard Bold (Sets)\mathbb{R}, \mathbb{N}, \mathbb{Z}$\mathbb{R}, \mathbb{N}, \mathbb{Z}$Calligraphic\mathcal{L}, \mathcal{O}$\mathcal{L}, \mathcal{O}$Roman / Normal Text\text{where } x > 0$\text{where } x > 0$Hat / Vector Arrow\hat{x}, \vec{v}$\hat{x}, \vec{v}$Overline / Underline\overline{A}, \underline{B}$\overline{A}, \underline{B}$"""file_name = "KATEX_LATEX_REFERENCE.md"with open(file_name, "w", encoding="utf-8") as f:f.write(katex_md_content)print(f"File created successfully: {file_name}")
```text?code_stdout&code_event_index=2
File created successfully: KATEX_LATEX_REFERENCE.md

I have created a standalone markdown file dedicated to KaTeX/LaTeX mathematical formatting: KATEX_LATEX_REFERENCE.md. KATEX_LATEX_REFERENCE  MD OpenSummary of What's Included in KATEX_LATEX_REFERENCE.md:Syntax Basics & Delimiters: Inline $ ... $ vs. Display Block $$ ... $$ math formatting.Arithmetic & Basic Operators: Fractions (\frac), radicals (\sqrt), superscripts, subscripts, dot/cross products.Relational Operators: Inequalities, equivalence (\equiv), approximations (\approx), limits/arrows (\to).Calculus & Advanced Mathematics: Limits (\lim), integrals (\int, \iint), summations (\sum), products (\prod), and partial derivatives (\partial).Full Greek Alphabet: Complete lowercase ($\alpha, \beta, \gamma, \dots$) and uppercase ($\Gamma, \Delta, \Theta, \dots$) symbol tables.Matrices & Environments: Standard brackets (bmatrix), parentheses (pmatrix), determinants (vmatrix), and piecewise functions (cases).Font Styles & Accents: Vector bold (\mathbf), set notation (\mathbb{R}), calligraphic (\mathcal), vectors (\vec), and text blocks (\text).