# prolog
The best Prolog visualizer https://cdglabs.org/prolog

Usage
---
- Tutorial: [Slideshare](http://www.slideshare.net/ZhixuanLai/prolog-visualizer), [PDF](https://www.dropbox.com/s/21sbrw9lzhrszlf/prolog.pdf?dl=0), [keynote](https://www.dropbox.com/s/3476ruts1ae1vm2/prolog.key?dl=0)
- Save the visualization to PDF by pressing ⌘+P

Grammar
---
~~~
Prolog {
  Program
    = Rule* Query

  Rule  -- a rule
    = Clause ':-' Clauses '.'  -- body
    | Clause '.'               -- noBody

  Query  -- a query
    = Clauses '?'

  Clause  -- a clause
    = symbol '(' Term (',' Term)* ')'  -- args
    | symbol                           -- noArgs

  Clauses
    = Clause (',' Clause)*

  Term
    = Clause
    | List
    | variable

  List
    = '[' ']'           -- empty
    | '[' Contents ']'  -- nonEmpty

  Contents
    = Term ',' Contents  -- cons1
    | Term '|' Term      -- cons2
    | Term               -- single

  variable  -- a variable
    = upper alnum*

  symbol -- a symbol
    = lower alnum*

  tokens
    = (variable | symbol | _)*
}
~~~

Credit
---

#### Authors:
- Zhixuan Lai
- Alessandro Warth

#### Made possible by:
- [Ohm](https://github.com/cdglabs/ohm)
- [React](http://facebook.github.io/react/)
- [react-router](https://github.com/rackt/react-router/)
- [flux](http://material-ui.com/#/)
- [material-ui](http://material-ui.com/#/)
- [marked](https://github.com/chjj/marked/)
- [react-code-mirror](https://github.com/ForbesLindesay/react-code-mirror)
- [urlencode](https://github.com/node-modules/urlencode/)
- ...
