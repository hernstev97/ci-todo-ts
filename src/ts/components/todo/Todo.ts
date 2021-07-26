import TodoItem from "../../interfaces/TodoItem";
import allItemsRemoveButtonVisibilityHandler from "../../util/allItemsRemoveButtonVisibilityHandler";
import { assignBulkEventListeners, removeBulkEventListeners } from "../../util/eventListeners";
import setFontSizeForEachTodo from "../../util/setFontSizeForEachTodo";
import { getDeviceOutput } from "../../util/getDeviceOutput";
import { getObjectInLocalStorage, setObjectInLocalStorage } from "../../util/setObjectInLocalStorage";
import addTodoElementToDom from "../../util/addElementToDom";
import { setDisabledAttribute } from "../../util/setDisabledAttribute";

export const todo = () => {
    const componentRoot = document.querySelector('[data-component="todo"]') as HTMLElement;
    const removeAllItemsButton = componentRoot.querySelector('[data-todo="removeAllItemsButton"]') as HTMLButtonElement;
    const addTodoTextInput = componentRoot.querySelector('[data-todo="addTodoTextInput"]') as HTMLInputElement;
    const addTodoFormElement = componentRoot.querySelector('[data-todo="addTodoForm"]') as HTMLFormElement;
    const todoList = componentRoot.querySelector('[data-todo="todoList"]') as HTMLDivElement
    let todoDomElementList = componentRoot.querySelectorAll('[data-todo="todoItem"]');
    let todoDoneCheckboxList = componentRoot.querySelectorAll('[data-todo="todoCompletedCheckbox"]');
    let deleteSingleTodoButtonList = componentRoot.querySelectorAll('[data-todo="deleteSingleTodoButton"]');
    let dragAndDropSortGrabberList = componentRoot.querySelectorAll('[data-todo="dragAndDropSortGrabber"]');
    let todoItems: TodoItem[] = [];
    let inputState: string;
    let isCurrentlyHoldingItem: boolean;
    let heldGrabber: HTMLDivElement | null; // todo ?rename
    let currentlyMovableTodo: HTMLDivElement | null;
    let currentlyMovableTodoRect: DOMRect | null;
    let timeout: number;
    let currentMaxIndex: number = 0; // todo ?rename

    const init = () => {
        buildTodosFromLocalStorage();

        todoDomElementList = componentRoot.querySelectorAll('[data-todo="todoItem"]');
        todoDoneCheckboxList = componentRoot.querySelectorAll('[data-todo="todoCompletedCheckbox"]');
        deleteSingleTodoButtonList = componentRoot.querySelectorAll('[data-todo="deleteSingleTodoButton"]');
        dragAndDropSortGrabberList = componentRoot.querySelectorAll('[data-todo="dragAndDropSortGrabber"]');

        allItemsRemoveButtonVisibilityHandler(todoItems, removeAllItemsButton);
        setDisabledSortButtons();
        bindEvents();
    }

    const bindEvents = () => {
        console.log("bindEvents()")
        addTodoTextInput.addEventListener( 'input', setInputState)

        addTodoFormElement.addEventListener('submit', handleFormSubmit)

        removeAllItemsButton.addEventListener('click', deleteAllTodos)

        window.addEventListener( 'mouseup', releaseItemHandler)

        // assignBulkEventListeners(todoDoneCheckboxList, 'change', toggleTodoComplete);

        todoDoneCheckboxList.forEach(element => {
            element.addEventListener('change', toggleTodoComplete)
        })

        assignBulkEventListeners(deleteSingleTodoButtonList, 'click', deleteSingleTodo)

        assignBulkEventListeners(dragAndDropSortGrabberList, 'mousedown', holdItemHandler)

        window.addEventListener('resize', () => {
            clearTimeout(timeout);

            timeout = window.setTimeout(() => {
                // first gets the font size via a text length comparison
                // then sets it to a value between 0.8 and 1.4 depending on
                // deviceOutput and which threshold is passed
                setFontSizeForEachTodo(todoDomElementList, getDeviceOutput());
            }, 250);
        })
    }

    const buildTodosFromLocalStorage = () => {
        todoItems = getObjectInLocalStorage('todoItems')
        currentMaxIndex = getObjectInLocalStorage('currentMaxIndex')
        console.log("currentMaxIndex", currentMaxIndex)
        renderAllTodos(todoItems);
    }

    const renderAllTodos = (todos: TodoItem[]) => {
        todoList.innerHTML = '';
        todos.forEach((item, index) => {
            addTodoElementToDom({
                id: item.id,
                title: item.title,
                completed: item.completed,
            });
        });
    }

    // ================ //
    // DRAG N DROP SORT //
    // ================ //
    /* todo get position of all todos while grabbing
     * todo delete positions after releasing grab
     * todo if y-position of currently held item is >= OR <= any item it takes its position, depending on movement up or down
     * [#1 item]
     * [#2 movingItem] <-- this will not take the position of #1 just because it is beyond the y-position of #1.
     * [#3 item]           only if #2 would be moved to the y-position of #1 or smaller (because of upwards movement)
     * [#4 item]           it would replace it. then #2 would become #1 and the other way around.
     * todo to detect upwards or downwards movement: compare to first initialized y-position of grabbed element.
     *  if the new position is larger than the older position it's downwards movement.
     * todo if there was movement in any direction but on release the grabbed item is not enough to surpass any element
     *  it should just return to its original position.
     * todo after release while surpassing a todoItem they should in theory just need to switch places in the array
     *  and the instance had to be rerendered
     * todo dont forget localStorage
     */
    const positionOfTodos = (): Record<string, number | Element>[] => {
        let positions: Record<string, number | Element>[] = [];

        Array.from(todoDomElementList).reverse().forEach((todo, index) => {
            positions.push({
                index: index,
                y: todo.getBoundingClientRect().y,
                height: todo.getBoundingClientRect().height,
                element: todo,
            })
        })

        return positions
    }

    // ============ //
    // GENERAL SORT //
    // ============ //
    /* todo register click event on up and down arrow buttons
     * todo on click detect if it was up or down
     * todo move item where a button has been clicked in the direction by reducing or increasing its index by 1
     * todo rerender the instance
     * todo dont forget localStorage
     */

    const setInputState = (event: Event) => {
        const input = event?.target as HTMLInputElement;
        inputState = input.value;
    }

    const toggleTodoComplete = (event: Event) => {
        console.log("clicked check")
        const element = event.currentTarget as HTMLElement;
        const id = element.dataset.id;
        const currentTodo = todoItems.find(item => `${item.id}` === id);
        const parent = element.parentElement?.parentElement;

        if (currentTodo === undefined) return;

        currentTodo.completed = !currentTodo.completed;

        if (currentTodo.completed)
            parent?.classList.add('todo--completed');
        else
            parent?.classList.remove('todo--completed');


        setObjectInLocalStorage('todoItems', todoItems);
    }

    const setDisabledSortButtons = () => {
        if (todoItems.length > 0) {
            const firstTodo = todoDomElementList[0];
            const lastTodo = todoDomElementList[todoDomElementList.length - 1];
            setDisabledAttribute(firstTodo, '[data-moveTodoInDirection="up"]')
            setDisabledAttribute(lastTodo, '[data-moveTodoInDirection="down"]')
        }
    }

    const deleteAllTodos = (event: Event) => {
        event.preventDefault();

        setObjectInLocalStorage('todoItems', [])
        todoItems = [];
        todoDomElementList.forEach(todo => {
            todo.remove();
        })
        allItemsRemoveButtonVisibilityHandler(todoItems, removeAllItemsButton);
    }

    // todo currently only one todo can be deleted before the site has to be refreshed
    const deleteSingleTodo = (event: Event) => {
        event.preventDefault();
        console.log("delete click")
        const target = event.currentTarget as HTMLButtonElement;
        const id = target.dataset.id;
        const parent = Array.from(todoDomElementList).find(todo => todo.getAttribute('data-id') === id);
        const currentTodo = todoItems.find(item => `${item.id}` === id);
        const currentTodoIndex = currentTodo ? todoItems.indexOf(currentTodo) : -1;

        for (let i = 0; i < todoItems.length; i++) {
            if (i === currentTodoIndex) {
                todoItems.splice(i, 1);
            }
        }

        // console.log("todoItems", todoItems)
        // console.log("event.target", event.target)
        //
        reRenderInstance();

        parent?.remove();
        allItemsRemoveButtonVisibilityHandler(todoItems, removeAllItemsButton);
        setObjectInLocalStorage('todoItems', todoItems);
    }

    // each function should serve 1 purpose and be relatively generic. it should be usable at multiple places.
    // todo wrapperfunction for 2 new functions with single purpose
    const handleFormSubmit = (event: Event) => {
        event.preventDefault();
        addTodo();
        reRenderInstance();
    }

    const addTodo = () => {
        if (addTodoTextInput.value.length === 0 || componentRoot === null) {
            return;
        }

        currentMaxIndex += 1;

        const todoItem: TodoItem = {
            id: currentMaxIndex,
            title: inputState,
            completed: false,
        }

        todoItems.push(todoItem);
        setObjectInLocalStorage('todoItems', todoItems);
        setObjectInLocalStorage('currentMaxIndex', currentMaxIndex);
        addTodoTextInput.value = '';
    }

    // todo only add eventlistener to elements that are new. not to old elements. no replacement!
    const reRenderInstance = () => {
        renderAllTodos(todoItems);

        todoDomElementList = componentRoot.querySelectorAll('[data-todo="todoItem"]');
        todoDoneCheckboxList = componentRoot.querySelectorAll('[data-todo="todoCompletedCheckbox"]');
        deleteSingleTodoButtonList = componentRoot.querySelectorAll('[data-todo="deleteSingleTodoButton"]');
        dragAndDropSortGrabberList = componentRoot.querySelectorAll('[data-todo="dragAndDropSortGrabber"]');

        allItemsRemoveButtonVisibilityHandler(todoItems, removeAllItemsButton);
        removeBulkEventListeners(todoDoneCheckboxList, 'change', toggleTodoComplete);
        assignBulkEventListeners(todoDoneCheckboxList, 'change', toggleTodoComplete);
        removeBulkEventListeners(deleteSingleTodoButtonList, 'click', deleteSingleTodo)
        assignBulkEventListeners(deleteSingleTodoButtonList, 'click', deleteSingleTodo)
        setDisabledSortButtons();
    }

    // WIP
    const holdItemHandler = (event: Event | MouseEvent) => {
        console.log("hold")
        if (event.type === 'mousedown') {
            isCurrentlyHoldingItem = true;
            heldGrabber = event.currentTarget as HTMLDivElement;
            if (heldGrabber){
                currentlyMovableTodo = heldGrabber.parentElement as HTMLDivElement;
                currentlyMovableTodoRect = currentlyMovableTodo.getBoundingClientRect();
                console.log("currentlyMovableItemRect", currentlyMovableTodoRect);
            }
            window.addEventListener('mousemove', determineNewPositionOfTodoAfterMoving)
        }
    }

    // WIP
    const releaseItemHandler = (event: Event | MouseEvent) => {
        console.log("release")
        if (heldGrabber && event.type === 'mouseup') {
            currentlyMovableTodo = heldGrabber.parentElement as HTMLDivElement;
            window.removeEventListener('mousemove', determineNewPositionOfTodoAfterMoving);
            heldGrabber.parentElement?.classList.remove('moving');
            heldGrabber = null;
            isCurrentlyHoldingItem = false;
        }
    }

    // WIP
    const determineNewPositionOfTodoAfterMoving = (event: Event | MouseEvent) => {
        if ("y" in event && heldGrabber && currentlyMovableTodo && currentlyMovableTodoRect) {
            const itemY = currentlyMovableTodoRect.y;
            const itemHeight = currentlyMovableTodoRect.height;
            const y = event.y;
            const pos = y - itemHeight + (itemHeight / 2) - itemY;

            // currentlyMovableItem.style.top = `${pos}px`;
            currentlyMovableTodo.classList.add('moving');
            currentlyMovableTodo.style.width = `${currentlyMovableTodoRect.width}px`;
            currentlyMovableTodo.style.top = `${y - (itemHeight / 2) - 16}px`;
            console.log(" ")
            console.log("top: ", `${y - (itemHeight / 2) - 16}px`)
            console.log(`${y} - ${itemHeight} + ${(itemHeight / 2)} - ${itemY} =`, pos)
            console.log(" ")

            // const initialPositionWhenGrabbed = 0;
            // const positionOfCursor = 0;
            // const halfHeightOfElement = 0;

            // console.log("positionOfTodos", positionOfTodos().map(pos => pos.element))
            // console.log("allTodos", allTodos)
        }
    }

    return { init };
}