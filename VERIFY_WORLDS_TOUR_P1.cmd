@echo off
setlocal
cd /d "%~dp0"
python "tools\tandem_tour_worlds\installer.py" verify
set "RESULT=%ERRORLEVEL%"
pause
exit /b %RESULT%
