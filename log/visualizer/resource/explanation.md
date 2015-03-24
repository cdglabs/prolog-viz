Printf Format String
===
This website is an educational tool that helps programmers understand the obscure template language used in printf.

### Usage
Hover over any expression in the visualization to see its documentation on the right.

Format placeholders
---
Formatting takes place via placeholders within the format string. For example, if a program wanted to print out a person's age, it could present the output by prefixing it with "Your age is ". To denote that we want the integer for the age to be shown immediately after that message, we may use the format string:

`"Your age is %d."`

The syntax for a format placeholder is

`%[parameter][flags][width][.precision][length]type`

### Parameter
**Parameter** can be omitted or can be:

Character|Description
---|---
<div id="$"/>`n$`| n is the number of the parameter to display using this format specifier, allowing the parameters provided to be output multiple times, using varying format specifiers or in different orders. If any single placeholder specifies a parameter, all the rest of the placeholders MUST also specify a parameter. This is a POSIX extension and not in C99. <br/> Example: `printf("%2$d %2$#x; %1$d %1$#x",16,17) produces "17 0x11; 16 0x10"`

### Flags
**Flags** can be zero or more (in any order) of:

Character|Description
---|---
<div id="-"/>`-`<br/>(minus)| Left-align the output of this placeholder (the default is to right-align the output).
<div id="+"/>`+`<br/>(plus)| Prepends a plus for positive signed-numeric types. positive = '`+`', negative = '`-`'. (the default doesn't prepend anything in front of positive numbers).
<div id=" "/>` `<br/>(space)| Prepends a space for positive signed-numeric types. positive = '<code> </code>', negative = '`-`'. This flag is ignored if the '`+`' flag exists. (the default doesn't prepend anything in front of positive numbers).
<div id="0"/>`0`<br/>(zero)| Prepends zeros for numbers when the width option is specified. (the default prepends spaces). Example: `printf("%2d", 3)` produces `" 3"`, while `printf("%02d", 3)` produces in `"03"`.
<div id="#"/>`#`<br/>(hash)| Alternate form. For '`g`' and '`G`', trailing zeros are not removed. For '`f`', '`F`', '`e`', '`E`', '`g`', '`G`', the output always contains a decimal point. For '`o`', '`x`', and '`X`', a `0`, `0x`, and `0X`, respectively, is prepended to non-zero numbers.

### Width
**Width** specifies a minimum number of characters to output, and is typically used to pad fixed-width fields in tabulated output, where the fields would otherwise be smaller, although it does not cause truncation of oversized fields. A leading zero in the width value is interpreted as the zero-padding flag mentioned above, and a negative value is treated as the positive value in conjunction with the left-alignment "`-`" flag also mentioned above.

### Precision
**Precision** usually specifies a maximum limit on the output, depending on the particular formatting type. For floating point numeric types, it specifies the number of digits to the right of the decimal point that the output should be rounded. For the string type, it limits the number of characters that should be output, after which the string is truncated.

### Length
**Length** can be omitted or be any of:

Character|Description
---|---
<div id="hh"/>`hh`| For integer types, causes `printf` to expect an `int`-sized integer argument which was promoted from a `char`.
<div id="h"/>`h`| For integer types, causes `printf` to expect an `int`-sized integer argument which was promoted from a `short`.
<div id="l"/>`l`| For integer types, causes `printf` to expect a `long`-sized integer argument. <br/> For floating point types, causes `printf` to expect a `double` argument.
<div id="ll"/>`ll`| For integer types, causes `printf` to expect a` long long`-sized integer argument.
<div id="L"/>`L`| For floating point types, causes `printf` to expect a `long double` argument.
<div id="z"/>`z`| For integer types, causes `printf` to expect a `size_t`-sized integer argument.
<div id="j"/>`j`| For integer types, causes `printf` to expect a `intmax_t`-sized integer argument.
<div id="t"/>`t`| For integer types, causes `printf` to expect a `ptrdiff_t`-sized integer argument.

### Specifier
**Specifier** can be any of:

Character|Description|Example
---|---|---
<div id="d"></div><div id="i"></div>`d`, `i`| `int` as a signed decimal number. '`%d`' and '`%i`' are synonymous for output, but are different when used with `scanf()` for input (where using `%i` will interpret a number as hexadecimal if it's preceded by `0x`, and octal if it's preceded by 0.)|`392`
<div id="u"/>`u`| Print decimal `unsigned int`.|`7235`
<div id="f"></div><div id="F"></div>`f`, `F`| `double` in normal (fixed-point) notation. '`f`' and '`F`' only differs in how the strings for an infinite number or NaN are printed ('`inf`', '`infinity`' and '`nan`' for '`f`', '`INF`', '`INFINITY`' and '`NAN`' for '`F`').|`392.65`
<div id="e"></div><div id="E"></div>`e`, `E`| `double` value in standard form ([`-`]d.ddd `e`[`+`/`-`]ddd). An `E` conversion uses the letter `E` (rather than `e`) to introduce the exponent. The exponent always contains at least two digits; if the value is zero, the exponent is `00`. In Windows, the exponent contains three digits by default, e.g. `1.5e002`, but this can be altered by Microsoft-specific `_set_output_format` function.|`3.9265e+2` `3.9265E+2`
<div id="g"></div><div id="G"></div>`g`, `G`| `double` in either normal or exponential notation, whichever is more appropriate for its magnitude. '`g`' uses lower-case letters, '`G`' uses upper-case letters. This type differs slightly from fixed-point notation in that insignificant zeroes to the right of the decimal point are not included. Also, the decimal point is not included on whole numbers.|`392.65`
<div id="x"></div><div id="X"></div>`x`, `X`| `unsigned int` as a hexadecimal number. '`x`' uses lower-case letters and '`X`' uses upper-case.|`7fa` `7FA`
<div id="o"/>`o`| `unsigned int` in octal.|`610`
<div id="s"/>`s`| null-terminated string.|`sample`
<div id="c"/>`c`| `char` (character).|`a`
<div id="p"/>`p`| `void *` (pointer to void) in an implementation-defined format.|`b8000000`
<div id="a"></div><div id="A"></div>`a`, `A`| `double` in hexadecimal notation, starting with "0x" or "0X". '`a`' uses lower-case letters, '`A`' uses upper-case letters.[9][10] (C++11 iostreams have a `hexfloat` that works the same).|`-0xc.90fep-2` `-0XC.90FEP-2`
<div id="n"/>`n`| Print nothing, but write number of characters successfully written so far into an integer pointer parameter.|
<div id="%"/>`%`| a literal '`%`' character (this type doesn't accept any flags, width, precision or length).|`%`

Credit
---
**Open Source Projects**
- [React](http://facebook.github.io/react/)
- [flux](http://material-ui.com/#/)
- [material-ui](http://material-ui.com/#/)
- [marked](https://github.com/chjj/marked/)
- [react-code-mirror](https://github.com/ForbesLindesay/react-code-mirror)
- [react-tween-state](https://github.com/chenglou/react-tween-state/)
- [google-closure-library](https://github.com/google/closure-library)
- ...

**Documentation**
- [wikipedia](http://en.wikipedia.org/wiki/Printf_format_string)
- [C++ documentation](http://www.cplusplus.com/reference/cstdio/printf/)
