import { ExerciseForm } from "../exercise-form";

export default function NewExercisePage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Nieuwe oefening</h1>
      <ExerciseForm />
    </div>
  );
}
