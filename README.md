# Free-Cities
A text-only slave management game. (18+)

## Downloading The Game

There are two methods of acquiring Free Cities:  
1. Downloading the latest compiled release from the [Blog](https://freecitiesblog.blogspot.com/).  
2. Cloning this repository and manually compiling the game (see below).  

### Compiling (Windows)

1. Navigate to the Free Cities directory.
2. Run compile.bat by double clicking the icon.
3. If no errors are reported, the compilation was a success.
4. The game will be compiled into a .html file in the Free Cities\bin directory.
5. Open the .html file with your web browser.

### Compiling (Linux x86_64)

1. Open your terminal emulator.
2. Use cd to change to the Free Cities directory.
3. Ensure that the compile script is executable ('chmod +x ./compile' if not).
5. Run './compile'.
6. The game will be compiled into a .html file in the Free Cities/bin directory.
7. Open the .html file with your web browser.

### sanityCheck and fixSpellingMistakes

These two tools check for common mistakes by grepping over the code.  It is worth running them frequently.

They can output false positives, but it's usually better to just modify the code a bit to get rid of the false positive,
to keep the output of the sanityCheck as clean as possible.

fixSpellingMistake takes several minutes to run, but it's worth running occasionally to automatically fix the top 4000 spelling
mistake according to wikipedia. 

Both were written in linux, but should work in the windows bash environment that you get when you install git.

### Notes

* On Windows, compile.bat and compile_debug.bat perform the same functions. The only difference between the two is that compile.bat will exit automatically, while compile_debug.bat will wait for a keypress before exiting. The latter is useful when checking for TweeGo error output, while the former saves you a keypress (as TweeGo errors are rare unless you make a mistake). Use whichever one you prefer.

### Receiving credit for contributions to FC

* FC Dev does not credit contributors without explicit permission. If you make contributions via GitHub and would like to be listed in the comments, please contact FC Dev with the name you'd like to be credited as and a brief summary of what you did.

## Contacts
[FC Dev](https://github.com/freecitiesdev) - Project Owner and Lead Developer.  
For questions regarding the game itself, contributing, or other project-related questions, please contact FC Dev at **freecitiesdev [at] gmail.com**.

[Spaghetti Code](https://github.com/ObstacleCorpse) - Repository Maintainer.  
For questions regarding the compiler, or contributor related help with Git, please contact Spaghetti Code at **spaghetticode [at] cock.li** or the /dgg/ discord.  
Hours of availability: 1200T/U - 0400T/U.
