Node-Task-Scheduler
===================

Node will use a task template to issue published messages to Redis and to publish messages in response to messages received through Redis. This in effect allows one to puppeteer the lifecycle of a task handler.



In the SDO folder you will find an example of a task handler that will fetch an image from nascom and save it to its working directory and then notify the task of its completion which will trigger a reaction message telling the task handler to issue a notification to the client (you) that the task is complete. It's a pretty crude example but a working demonstration none the less.



## Tasks
Tasks have many subroutines organized into a linear procedure.

## Subroutines
Subroutines are composed of a set of instructions and a map of reactions.
The instructions are akin to the constructor or initialization. The reactions serve as callbacks or methods within a task.

## Instructions
Instructions map channel and messages into Redis

## Reactions
Reactions map a channel subscription message reciept to the execution of a subroutine.




##### TODO

* Save state of task list (remove completed tasks that don't repeat)
* Inter-Task relationships and communications.
* Create web console UI for viewing and managing the scheduled tasks.
* Log task messaging through redis and log it for each completed task.
* Archive completed task meta data.