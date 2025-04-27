import { ref, computed } from 'vue'
import { useTodoStore } from '@/stores/todo'

export function useTodos() {
  const todoStore = useTodoStore()
  const newTodo = ref('')

  const total = computed(() => {
    return todoStore.todos.length
  })

  const add = () => {
    todoStore.addTodo(newTodo.value)
    newTodo.value = ''
  }

  return {
    newTodo,
    total,
    todos: todoStore.todos,
    add,
    toggle: todoStore.toggleTodo,
  }
}
