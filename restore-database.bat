@echo off
echo Restoring PostgreSQL database...

rem New Railway database details
set HOST=tramway.proxy.rlwy.net
set PORT=37632
set USER=postgres
set DB=railway
set PASSWORD=jZaZAqHfvDbsDjuWGdquOYBXVaanMWqb
set BACKUP_FILE=rentspot_db_backup.sql

echo Restoring database from %BACKUP_FILE%...
set PGPASSWORD=%PASSWORD%
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h %HOST% -p %PORT% -U %USER% -d %DB% -f %BACKUP_FILE%

echo Restore complete!
pause 