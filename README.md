# clearevo fun tools

Four small in-browser tools, deployed under www.clearevo.com/{doctor,calc,isearch,hex}:

- **/doctor** - 'almost' Emacs `M-x doctor` (ELIZA psychotherapist, RET-twice submit)
- **/calc** - 'almost' Emacs `M-x calc` (RPN stack, *Calc Trail* pane, RET dup / TAB swap / n / & / Q / U undo)
- **/isearch** - 'almost' Emacs isearch over pasted/opened text (C-s / C-r, smart case, authentic Failing/Wrapped messages)
- **/hex** - ClearEvo hex viewer/editor: edit bytes, search hex/text/**bit sequences at any bit offset** (bless-style), save edited file

All 100% client-side. `./test.sh` runs the engine tests; `./push.sh` deploys the whole site.
