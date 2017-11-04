import android.content.Context;
import android.graphics.Rect;
import android.os.Handler;
import android.os.Message;
import android.util.AttributeSet;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.widget.ScrollView;

import java.util.Timer;
import java.util.TimerTask;

/**
 * Created by tianxiying on 2017/10/9.
 */

public class BounceScrollView extends ScrollView {
    private View inner;
    private float y;    //记录按下时的y坐标
    private float tempDown, tempUp;     //布局滑动距离
    private Rect normal = new Rect();
    private static int radio = 3;   //滑动比例
    private int mActivePointerId;
    private Handler handler;
    private MyTimer timer;
    private static boolean isPull = false; //拉动时不进行其他操作
    private boolean isBackUp = true; //控制靠近顶部／底部

    public void setOnPullListener(OnPullListener onPullListener) {
        this.onPullListener = onPullListener;
    }

    private OnPullListener onPullListener;

    public BounceScrollView(Context context) {
        this(context, null);
    }

    public BounceScrollView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public BounceScrollView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        initView(context, attrs, defStyleAttr);
    }

    private void initView(Context context, AttributeSet attrs, int defStyleAttr) {
        handler = new BackHandler();
        timer = new MyTimer(handler);
        onPullListener = new OnPullListener() {
            @Override
            public void pullUp(int dif_y) {
                Log.d("txy", "pullUp");
            }

            @Override
            public void pullDown(int dif_y) {
                Log.d("txy", "pullDown");
            }

            @Override
            public void backDown() {

            }

            @Override
            public void backUp() {

            }
        };
        this.setOnTouchListener(new OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                return isPull;
            }
        });
    }

    /**
     * 获得第一个view
     */
    @Override
    protected void onFinishInflate() {
        if (getChildCount() > 0) {
            inner = getChildAt(0);
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent ev) {
        return super.onTouchEvent(ev);
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent event) {
        if (inner == null) {
            return super.onTouchEvent(event);
        } else {
            commOnTouchEvent(event);
        }

        super.dispatchTouchEvent(event);

        return true;
    }

    /**
     * 添加手势响应事件
     *
     * @param ev
     */
    public void commOnTouchEvent(MotionEvent ev) {
        int action = ev.getAction();
        switch (action & MotionEvent.ACTION_MASK) {
            case MotionEvent.ACTION_DOWN:
                y = ev.getY();
                timer.cancel();
                mActivePointerId = ev.getPointerId(0);
                break;
            case MotionEvent.ACTION_UP:
                hide();
                break;
            case MotionEvent.ACTION_POINTER_UP:
                // 多点触碰
                onSecondaryPointerUp(ev);
                break;
            case MotionEvent.ACTION_MOVE:
                final int activePointerIndex = ev.findPointerIndex(mActivePointerId);
                final float preY = y;
                float nowY = ev.getY(activePointerIndex);
                // 根据下拉距离改变比例
                radio = (int) (3 + 2 * Math.tan(Math.PI / 2 / getMeasuredHeight()
                        * Math.abs(inner.getTop())));
                int deltaY = (int) (preY - nowY) / radio;
                y = nowY;
                if (inner.getTop() - deltaY > 0) {
                    if (!isBackUp) {
                        onPullListener.backUp();
                        isBackUp = true;
                    }
                } else {
                    if (isBackUp) {
                        onPullListener.backDown();
                        isBackUp = false;
                    }
                }
                // 当滚动到最上或者最下时就不会再滚动，这时移动布局
                if (isNeedMove()) {
                    if (normal.isEmpty()) {
                        // 保存正常的布局位置
                        normal.set(inner.getLeft(), inner.getTop(),
                                inner.getRight(), inner.getBottom());
                        return;
                    }
                    int offset = inner.getMeasuredHeight() - getHeight();
                    int scrollY = getScrollY();
                    //当正在拉动时，加锁
                    if (scrollY == 0) {
                        if (inner.getTop() - deltaY > 0) {
                            isPull = true;
                            onPullListener.pullUp(inner.getTop() - deltaY);

                        }
                    }
                    if (scrollY == offset) {
                        if (inner.getTop() - deltaY < 0) {
                            isPull = true;
                            onPullListener.pullDown(inner.getTop() - deltaY);
                        }
                    }
                    //这里移动布局
                    inner.layout(inner.getLeft(), inner.getTop() - deltaY, inner.getRight(),
                            inner.getBottom() - deltaY);
                }
                break;
        }
    }

    private void onSecondaryPointerUp(MotionEvent ev) {

        final int pointerIndex = (ev.getAction() & MotionEvent.ACTION_POINTER_ID_MASK) >>
                MotionEvent.ACTION_POINTER_ID_SHIFT;
        final int pointerId = ev.getPointerId(pointerIndex);
        if (pointerId == mActivePointerId) {
            // This was our active pointer going up. Choose a new
            // active pointer and adjust accordingly.
            final int newPointerIndex = pointerIndex == 0 ? 1 : 0;
            y = ev.getY(newPointerIndex);
            mActivePointerId = ev.getPointerId(newPointerIndex);
        }
    }

    // 是否需要移动布局
    public boolean isNeedMove() {
        int offset = inner.getMeasuredHeight() - getHeight();
        int scrollY = getScrollY();
        Log.d("txy", "offset:" + offset);
        if (scrollY == 0 || scrollY == offset) {
            return true;
        }
        return false;
    }


    /**
     * 执行自动回滚的handler
     */
    class BackHandler extends Handler {

        @Override
        public void handleMessage(Message msg) {
            if (null != inner) {
                // 回弹速度随下拉距离moveDeltaY增大而增大
                float speed;
                if (tempDown > 0) {
                    speed = 10 + 10 * (Math.abs(tempDown) + 1) / 1000;
                    tempDown -= speed;
                    if (tempDown < 0) {
                        tempDown = 0;
                        isPull = false;
                        timer.cancel();
                    }
                    inner.layout(normal.left, (int) (normal.top + tempDown), normal.right, (int) (normal.bottom + tempDown));
                }
                if (tempUp > 0) {
                    speed = 10 + 10 * (Math.abs(tempUp) + 1) / 1000;
                    tempUp -= speed;
                    if (tempUp < 0) {
                        tempUp = 0;
                        isPull = false;
                        timer.cancel();
                    }
                    inner.layout(normal.left, (int) (normal.top - tempUp), normal.right, (int) (normal.bottom - tempUp));
                }
            }
        }

    }

    /**
     * 布局回弹到初始位置
     */
    private void hide() {
        tempDown = inner.getTop() - normal.top;
        tempUp = normal.bottom - inner.getBottom();
        timer.schedule(5);
    }

    class MyTimer {
        private Handler handler;
        private Timer timer;
        private MyTask mTask;

        public MyTimer(Handler handler) {
            this.handler = handler;
            timer = new Timer();
        }

        public void schedule(long period) {
            if (mTask != null) {
                mTask.cancel();
                mTask = null;
            }
            mTask = new MyTask(handler);
            timer.schedule(mTask, 0, period);
        }

        public void cancel() {
            if (mTask != null) {
                mTask.cancel();
                mTask = null;
            }
        }

        class MyTask extends TimerTask {
            private Handler handler;

            public MyTask(Handler handler) {
                this.handler = handler;
            }

            @Override
            public void run() {
                handler.obtainMessage().sendToTarget();
            }

        }
    }

    public static interface OnPullListener {
        void pullUp(int dif_y);

        void pullDown(int dif_y);

        void backDown();

        void backUp();
    }
}
