const fs = require("fs");
const file = "d:/projects/jvm/lms/src/app/admin/courses/[id]/CourseDetailClient.tsx";
let code = fs.readFileSync(file, "utf8");

const bad = `                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 font-mono text-[11px]"
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingLesson ? "Save Lesson" : "Create Lesson"}
                </button>
              </div>
            </form>`;

const good = `                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 font-mono text-[11px]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Lesson Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description..."
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModuleForLesson(null);
                    setEditingLesson(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingLesson ? "Save Lesson" : "Create Lesson"}
                </button>
              </div>
            </form>`;

if (!code.includes(bad)) {
  console.error("Pattern not found!");
  process.exit(1);
}

code = code.replace(bad, good);
fs.writeFileSync(file, code, "utf8");
console.log("Successfully fixed CourseDetailClient.tsx!");
