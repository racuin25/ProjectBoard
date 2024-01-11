import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BoardInterface } from '../../shared/types/board.interface';
import { SocketService } from '../../shared/services/socket.service';
import { SocketEventsEnum } from '../../shared/types/socketEvents.enum';
import { ColumnInterface } from '../../shared/types/column.interface';
import { TaskInterface } from '../../shared/types/task.interface';

@Injectable()
export class BoardService {
  board$ = new BehaviorSubject<BoardInterface | null>(null);
  columns$ = new BehaviorSubject<ColumnInterface[]>([]);
  task$ = new BehaviorSubject<TaskInterface[]>([]);

  constructor(private socketService: SocketService) {}

  setBoard(board: BoardInterface): void {
    this.board$.next(board);
  }

  setColumns(columns: ColumnInterface[]): void {
    this.columns$.next(columns);
  }

  setTasks(tasks: TaskInterface[]): void {
    this.task$.next(tasks);
  }

  leaveBoard(boardId: string): void {
    this.board$.next(null);
    this.socketService.emit(SocketEventsEnum.boardsLeave, { boardId });
  }

  addColumn(column: ColumnInterface): void {
    const updatedColumns = [...this.columns$.getValue(), column];
    this.columns$.next(updatedColumns);
  }

  addTask(task: TaskInterface): void {
    const updatedTasks = [...this.task$.getValue(), task];
    this.task$.next(updatedTasks);
  }
}
