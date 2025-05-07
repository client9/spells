This is a CLI program that uses Apple MacOSX's system spellchecker.

It works very strangely.

```sh
$  ./spellcheck cemetary
cemetary ---> Optional("cemetery")
$ ./spellcheck cemetary
cemetary ---> nil
```

