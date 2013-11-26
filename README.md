Node-Task-Scheduler
===================

Node will use a task template to issue published messages to Redis and to publish messages in response to messages received through Redis. This in effect allows one to puppeteer the lifecycle of a task handler.



In the SDO folder you will find an example of a task handler that will fetch an image from nascom and save it to its working directory and then notify the task of its completion which will trigger a reaction message telling the task handler to issue a notification to the client (you) that the task is complete. It's a pretty crude example but a working demonstration none the less.