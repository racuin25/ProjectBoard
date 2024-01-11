import { Component, OnDestroy, OnInit } from '@angular/core';
import { BoardsService } from '../../shared/services/boards.service';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { BoardService } from '../services/board.services';
import {
  Observable,
  Subject,
  combineLatest,
  filter,
  map,
  takeUntil,
} from 'rxjs';
import { BoardInterface } from '../../shared/types/board.interface';
import { SocketService } from '../../shared/services/socket.service';
import { SocketEventsEnum } from '../../shared/types/socketEvents.enum';
import { ColumnsService } from '../../shared/services/columns.services';
import { ColumnInterface } from '../../shared/types/column.interface';
import { ColumnInputInterface } from '../../shared/types/columnInput.interface';
import { TaskInterface } from '../../shared/types/task.interface';
import { TasksService } from '../../shared/services/tasks.service';
import { TaskInputInterface } from '../../shared/types/taskInput.interface';

@Component({
  selector: 'board',
  templateUrl: './board.component.html',
})
export class BoardComponent implements OnInit, OnDestroy {
  boardId: string;
  data$: Observable<{
    board: BoardInterface;
    columns: ColumnInterface[];
    tasks: TaskInterface[];
  }>;
  unsubscribe$ = new Subject<void>();

  constructor(
    private boardsService: BoardsService,
    private route: ActivatedRoute,
    private router: Router,
    private boardService: BoardService,
    private socketService: SocketService,
    private columnsService: ColumnsService,
    private tasksService: TasksService
  ) {
    const boardId = this.route.snapshot.paramMap.get('boardId');

    if (!boardId) throw new Error('Cant get boardID from url');

    this.boardId = boardId;
    this.data$ = combineLatest([
      this.boardService.board$.pipe(filter(Boolean)),
      this.boardService.columns$,
      this.boardService.task$,
    ]).pipe(
      map(([board, columns, tasks]) => ({
        board,
        columns,
        tasks,
      }))
    );
  }

  ngOnInit(): void {
    this.socketService.emit(SocketEventsEnum.boardsJoin, {
      boardId: this.boardId,
    });
    this.fetchData();
    this.initializeListeners();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  initializeListeners(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.boardService.leaveBoard(this.boardId);
      }
    });
    this.socketService
      .listen<ColumnInterface>(SocketEventsEnum.columnsCreateSuccess)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((column) => {
        this.boardService.addColumn(column);
      });

    this.socketService
      .listen<ColumnInterface>(SocketEventsEnum.columnsUpdateSuccess)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((column) => {
        this.boardService.updateColumn(column);
      });

    this.socketService
      .listen<string>(SocketEventsEnum.columnsDeleteSuccess)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((columnId) => {
        this.boardService.deleteColumn(columnId);
      });

    this.socketService
      .listen<TaskInterface>(SocketEventsEnum.tasksCreateSuccess)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((task) => {
        this.boardService.addTask(task);
      });

    this.socketService
      .listen<BoardInterface>(SocketEventsEnum.boardsUpdateSuccess)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((updatedBoard) => {
        this.boardService.updateBoard(updatedBoard);
      });

    this.socketService
      .listen<void>(SocketEventsEnum.boardsDeleteSuccess)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.router.navigateByUrl('/boards');
      });
  }

  fetchData(): void {
    this.boardsService.getBoard(this.boardId).subscribe((board) => {
      this.boardService.setBoard(board);
    });

    this.columnsService.getColumns(this.boardId).subscribe((columns) => {
      this.boardService.setColumns(columns);
    });

    this.tasksService.getTasks(this.boardId).subscribe((tasks) => {
      this.boardService.setTasks(tasks);
    });
  }

  createColumn(title: string): void {
    const columnInput: ColumnInputInterface = {
      title,
      boardId: this.boardId,
    };
    this.columnsService.createColumn(columnInput);
  }

  createTask(title: string, columnId: string): void {
    const taskInput: TaskInputInterface = {
      title,
      boardId: this.boardId,
      columnId,
    };
    this.tasksService.createTask(taskInput);
  }

  getTasksByColumn(columnId: string, tasks: TaskInterface[]): TaskInterface[] {
    return tasks.filter((task) => task.columnId === columnId);
  }

  updateBoardName(boardName: string): void {
    this.boardsService.updateBoard(this.boardId, { title: boardName });
  }

  deleteBoard(): void {
    if (confirm('Are you sure you want to delete the board?')) {
      this.boardsService.deleteBoard(this.boardId);
    }
  }

  deleteColumn(columnId: string): void {
    this.columnsService.deleteColumn(this.boardId, columnId);
  }

  updateColumnName(columnName: string, columnId: string): void {
    this.columnsService.updateColumn(this.boardId, columnId, {
      title: columnName,
    });
  }
}
