1. Copy this entire folder and paste it on a secure place on the client pc. NOTE: Files shouldn't be deleted or accessed 
2. Install Node 25.2.1 and NPM 11.11.1(Npm will be installed automatically just confirm it)  (Files in setup folder)
3. Install Postgresssql (Files in setup folder)

Open PGadmin4
enter password and login

Left side, Below Server>Postgresql>database,
right click on database, create database name it as Balaji
Once after creted right click on Balaji and click restore and select backup file which is located on package folder


4. Redirect to the project folder (In command prompt)
5. Enter this Command "npm install --production"



6. In command line "

npm install -g pm2
don't blindly set that package folder path, its inside dist/index.js """"c to destop will be diff other will be same""""
pm2 start C:\Users\vansh\OneDrive\Desktop\Package\dist\index.js --name "Balaji Backend"
pm2 serve C:\Users\vansh\OneDrive\Desktop\Package 3000 --spa --name "frontend"
pm2 save

npm install -g pm2-windows-startup
pm2-startup install
pm2 save

"
""""open chrome and type localhost:3000""""

7. 
once its done make sure the web app is opening 
localhost:3000 - for frontend
localhost:5000 - for backend
8. Once web app is opening go to task scheduler, 
select when the computer starts
create a new basic task,
Program/script: pm2
Add arguments: resurrect

Finish it.

9. After Pc restart make sure its working without any manual command or any other effort.


