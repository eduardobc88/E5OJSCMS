# E5OJSCMS
E5OJS - CMS
<br>
This is a Alpha preview
<br>
<ul>
  <li>Install Nodejs</li>
  <li>Install Git</li>
  <li>Install MongoDB</li>
  <li>Install Nginx</li>
  <li>Run and test MongoDB and Nginx</li>
  <li>Clone e5ojs-cms</li>
  <li>Copy the content nginx.conf file to your Nginx config file(To find, run #nginx -V and search the --config dir), replace server routes by your routes and reload nginx</li>
  <li>Run #npm install</li>
  <li>Run #bower install</li>
  <li>Run #sudo npm install -g pm2</li>
  <li>Run mongorestore to import DB</li>
  <li>Create "uploads/sizes/" directories under e5ojs-public</li>
  <li>Run the server with: #pm2 start bin/www --name e5ojs -i 0</li>
  <li>To enter to login, use /admin and user and pass are "admin" on both</li>
  <li>The app running in 5000 port, check the localhost:5000 and if not show the static files as css, js and images you must check the nginx config file and fix it as you need</li>
</ul>
<br>
<br>
Session
<img style="padding-left:60px; padding-right:60px" src="https://lh3.googleusercontent.com/DaQa96jtkqCD6Vv64f2xHZs9kydcgfhXqsqm9JcSrGb792JgX7EQpOtkJi3RlU388elsArMHqb_X39Q=w1523-h947-rw">
<br>
Admin page
<img style="padding-left:60px; padding-right:60px" src="https://lh4.googleusercontent.com/xzbkd7-ICdLFIU3pLU0TeywnpSCcoAidgYXZlwMsZXu2ysGfxQcIbyxrYbd-HsZnH3wpUBXaakhkgCg=w1523-h947-rw">
