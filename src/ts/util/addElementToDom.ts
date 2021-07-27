import TodoItem from "../interfaces/TodoItem";

export default function addTodoElementToDom(todoItem: TodoItem) {
    // todo change todo__title to todo__title--edit when being edited

    const todoList = document.querySelector('.todo-list') as HTMLDivElement;
    const todoDomElement = `
        <div data-todo="todoItem" class="todo ${todoItem.completed ? 'todo--completed' : ''}" data-id="${todoItem.id}">
            <div class="todo__flex-container">
                <input data-todo="todoCompletedCheckbox" type="checkbox" data-id="${todoItem.id}" ${todoItem.completed ? 'checked' : ''}>
                <div class="todo__title" data-todo="todoTitle">
                    <p class="todo__label">${todoItem.title}</p>
                    <input data-todo="editTodoInput" class="todo__edit" type="text" value="${todoItem.title}" />
                </div>
                <div class="todo__move-delete-wrapper">
                    <button class="todo__move todo__move--up" data-id="${todoItem.id}" data-moveTodoInDirection="up">
                        <div></div>
                    </button>
                    <button data-todo="deleteSingleTodoButton" class="todo__item-delete" data-id="${todoItem.id}"></button>
                    <button class="todo__move todo__move--down" data-id="${todoItem.id}" data-moveTodoInDirection="down">
                        <div></div>
                    </button>
                </div>
            </div>
            <div data-todo="dragAndDropSortGrabber" class="todo__grabber"></div>
        </div>`

    // todoList.innerHTML += todoDomElement;
    // had to change from innerHTML to insertAdjacentHTML because with innerHTML
    // all the domelements are basically rebuild. so all event listeners would have to be reset. see the link below.
    // https://stackoverflow.com/questions/5113105/manipulating-innerhtml-removes-the-event-handler-of-a-child-element
    todoList.insertAdjacentHTML('beforeend', todoDomElement)

}