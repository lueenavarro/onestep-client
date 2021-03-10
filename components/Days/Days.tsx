import React, { useEffect, useState } from "react";
import { cloneDeep } from "lodash";

import Day from "components/Day";
import DragDropContext from "shared/components/DragDropContext";
import Loading from "shared/components/Loading";
import task from "services/taskService";
import { DragEndResult, ITaskList, KeyString } from "types";
import { getMiddle } from "utils/array";
import { addDays } from "utils/dateTime";

import styles from "./Days.module.scss";

const Days = () => {
  const firstDay = addDays(new Date(), -2);
  const [dates, setDates] = useState({
    start: firstDay,
    end: addDays(firstDay, 6),
  });
  const [taskLists, setTaskLists] = useState<KeyString<ITaskList>>(null);

  const getTasks = async () => {
    const data = await task.current(dates.start, dates.end);
    setTaskLists(data);
  };

  useEffect(() => {
    getTasks();
  }, [dates]);

  const handleDragEnd = async (result: DragEndResult) => {
    if (result.destination) {
      const oldTasks = cloneDeep(taskLists);
      setTaskLists(task.optimisticMove(taskLists, result));

      try {
        await task.move(result);
      } catch (error) {
        setTaskLists(oldTasks);
      }

      await getTasks();
    }
  };

  const handleAddTask = async (
    newTask: string,
    date: string,
    next: Function
  ) => {
    await task.add(newTask, date);
    await getTasks();
    next();
  };

  const handleRemoveTask = async (_id: string, date: string) => {
    const oldTasks = cloneDeep(taskLists);
    setTaskLists(task.optimisticRemove(taskLists, _id, date));

    try {
      await task.remove(_id);
    } catch (error) {
      setTaskLists(oldTasks);
    }

    await getTasks();
  };

  const handleCompleteTask = async (_id: string, completed: boolean) => {
    await task.complete(_id, completed);
    await getTasks();
  };

  const next = () =>
    setDates({
      start: addDays(dates.start, 1),
      end: addDays(dates.end, 1),
    });

  const prev = () =>
    setDates({
      start: addDays(dates.start, -1),
      end: addDays(dates.end, -1),
    });

  return (
    <>
      {!taskLists && <Loading />}
      {taskLists && (
        <section className={styles.days}>
          <div className={styles.prev} onClick={prev}>
            <div className={styles.arrow}></div>
          </div>
          <div className={styles["days__slide"]}>
            <DragDropContext onDragEnd={handleDragEnd}>
              {getMiddle(Object.values(taskLists)).map(
                (taskList: ITaskList) => (
                  <Day
                    key={taskList.date}
                    onAddTask={handleAddTask}
                    onRemove={handleRemoveTask}
                    onComplete={handleCompleteTask}
                    {...taskList}
                  />
                )
              )}
            </DragDropContext>
          </div>
          <div className={styles.next} onClick={next}>
            <div className={styles.arrow}></div>
          </div>
        </section>
      )}
    </>
  );
};

export default Days;
