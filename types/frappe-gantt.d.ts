declare module "frappe-gantt" {
  export type GanttTask = {
    id: string;
    name: string;
    start: string;
    end: string;
    progress?: number;
  };

  export type GanttOptions = {
    view_mode?: "Day" | "Week" | "Month" | "Year";
    readonly?: boolean;
    on_click?: (task: GanttTask) => void;
    [key: string]: unknown;
  };

  export default class Gantt {
    constructor(
      wrapper: string | HTMLElement,
      tasks: GanttTask[],
      options?: GanttOptions,
    );
  }
}
