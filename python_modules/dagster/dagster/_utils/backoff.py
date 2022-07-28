import time
from typing import Callable, Dict, Generator, List, Optional, Tuple, TypeVar

T = TypeVar("T")

import dagster._check as check


def backoff_delay_generator():
    i = 0.1
    while True:
        yield i
        i = i * 2


BACKOFF_MAX_RETRIES = 4


def backoff(
    fn: Callable[..., T],
    retry_on: Tuple[object, ...],
    args: Optional[List[object]] = None,
    kwargs: Optional[Dict[str, object]] = None,
    max_retries: int = BACKOFF_MAX_RETRIES,
    delay_generator: Generator = backoff_delay_generator(),
) -> T:
    """Straightforward backoff implementation.

    Note that this doesn't implement any jitter on the delays, so probably won't be appropriate for very
    parallel situations.

    Args:
        fn (Callable): The function to wrap in a backoff/retry loop.
        retry_on (Tuple[Exception, ...]): The exception classes on which to retry. Note that we don't (yet)
            have any support for matching the exception messages.
        args (Optional[List[Any]]): Positional args to pass to the callable.
        kwargs (Optional[Dict[str, Any]]): Keyword args to pass to the callable.
        max_retries (Optional[Int]): The maximum number of times to retry a failed fn call. Set to 0 for no backoff.
            Default: 4
        delay_generator (Generator[float, None, None]): Generates the successive delays between retry attempts.
    """
    check.callable_param(fn, "fn")
    retry_on = check.tuple_param(retry_on, "retry_on")
    args = check.opt_list_param(args, "args")
    kwargs = check.opt_dict_param(kwargs, "kwargs", key_type=str)
    check.int_param(max_retries, "max_retries")
    check.generator_param(delay_generator, "delay_generator")

    retries = 0

    to_raise = None

    try:
        return fn(*args, **kwargs)
    except retry_on as exc:
        to_raise = exc

    while retries < max_retries:
        time.sleep(next(delay_generator))
        try:
            return fn(*args, **kwargs)
        except retry_on as exc:
            retries += 1
            to_raise = exc
            continue

    raise to_raise