# คำสั่ง

```cmd
docker exec -it mysql_db mysql -u root -proot123456 -e "DROP DATABASE gyms_api;"

docker exec -i mysql_db mysql -u root -proot123456 < schema.sql
docker exec -i mysql_db mysql -u root -proot123456 < seed.sql

```