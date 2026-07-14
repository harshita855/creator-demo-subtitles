// A single source of truth for the queue name - if api and worker
// ever disagreed on this string, jobs would silently vanish into
// a queue nobody is listening to.
export const TRANSCRIPTION_QUEUE_NAME = "transcription-jobs";