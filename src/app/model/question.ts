import { ForumPost } from './forum-post';
import { Answer } from './answer';

export class Question extends ForumPost{
    title: string;
    tags: string;
    viewed: number;
    answers: Array<Answer>;
    bestAnswer: Answer;
    voteLog: Map<string, number>;

    constructor() {
        super();
        this.viewed = 0
        this.score = 0;
        this.published = Date.now()
    }
}