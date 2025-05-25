@echo off
echo Creating PostgreSQL database backup...

set HOST=junction.proxy.rlwy.net
set PORT=21847
set USER=postgres
set DB=railway
set PASSWORD=DDFUdwxsbrdIxAkdGuGBcrohRkzWrTcn
set OUTPUT_FILE=rentspot_db_backup.sql

echo Backing up database to %OUTPUT_FILE%...
set PGPASSWORD=%PASSWORD%
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -h %HOST% -p %PORT% -U %USER% -d %DB% -f %OUTPUT_FILE%

echo Backup complete! File saved as: %OUTPUT_FILE%
pause 