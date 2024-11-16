import { useUserStore } from '@/stores/authStore';
import { useDiaryStore } from '@/stores/diaryStore';
import { useAnswerStore } from '@/stores/answerStore';
import { useMediaStore } from './mediaStore';
import { useQuestionStore } from './responseStore';
import { useMedicineStore } from './medicinStore';
import { useDepartmentsStore } from './departmentsStore';

export {
  useUserStore,
  useDiaryStore,
  useAnswerStore,
  useMediaStore,
  useQuestionStore,
  useMedicineStore,
  useDepartmentsStore
}