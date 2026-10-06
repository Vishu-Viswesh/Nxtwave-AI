@echo off
cd /d "%~dp0"
echo Testing server.py...
py -c "import server; print('OK - server.py loads successfully')"
pause
