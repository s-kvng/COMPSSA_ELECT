// VoteStatus — returned by castVote
export type VoteStatus =
  | { status: "success" }
  | { status: "already_voted" }
  | { status: "election_closed" }
  | { status: "must_change_password" }
  | { status: "not_active" };

// ElectionResultStatus — returned by electionResults when results are hidden
export type ElectionResultStatus =
  | { status: "voting_in_progress" }
  | { status: "not_published" };
