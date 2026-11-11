You should make a site similar to [FlixMuffin](https://flixmuffin.st).
The APIs you should use are represented [here](/image.png).
The platform should be made in Tauri with Typescript and React
Write a github CI workflow.
Also write a workflow that upon execution compiles the app to desktop (windows, mac, linux) and mobile (android). The app should also work on the web with docker compose.
Users may watch movies or TV shows unauthenticated but if they do authenticate they can see what they were watching, favorite some shows and see some other relevant statistics.
For authentication user should only provide Username and Password (for  registration and login).
I want the website to be responsive and have a polished design just like [FlixMuffin](https://flixmuffin.st) or [HydraHD](https://hydrahd.gd/).
Should be able to browse for content and everything else.
Do not include comments or emojis in the code.
Make sure you follow industry best practices.
You may initialize a local repository and do regular commits there but do not push or create a repository to github. Use git.
Make the design beautiful, polished and responsive.
After you are done you may rewrite this README.md with the appropriate content for this.
This is intended to be a really cool self-hostable app for people.
People should be able to run it using docker compose (runs the web) and then the mobile and desktop versions can be used too.
For authentication consider using JWT with http only cookies. (That will work cross platofrm because of tauri.)