import React from 'react';
import {
    Dimensions,
    View,
    Image,
    StyleSheet,
    PanResponder,
} from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

const ScreenWidth = Dimensions.get('window').width;

export default class MySlider extends React.Component {
    static propTypes = {
        height: PropTypes.number, // 控件高度
        width: PropTypes.number, // 控件宽度
        maximumTrackTintColor: PropTypes.string, // 进度条背景颜色
        minimumTrackTintColor: PropTypes.string, // 进度条进度部分颜色
        onChange: PropTypes.func, // 进度值发生改变时的回调
        onAfterChange: PropTypes.func, // 拖动结束时的回调
        defaultValue: PropTypes.number, // 默认的进度值
        min: PropTypes.number.isRequired, // 进度范围最小值
        max: PropTypes.number.isRequired, // 进度范围最大值
        step: PropTypes.number.isRequired, // 步长（进度变化的最小单位）
        disabled: PropTypes.bool, // 是否可以拖动
        thumbSize: PropTypes.number, // 滑块的尺寸
        thumbImage: PropTypes.number, // 滑块的图片
        processHeight: PropTypes.number, // 进度条高度
    };

    static defaultProps = {
        height: 60,
        width: ScreenWidth,
        onChange: () => {},
        onAfterChange: () => {},
        defaultValue: 0,
        disabled: false,
        thumbSize: 30,
        thumbImage: null,
        maximumTrackTintColor: '#dcdbdb',
        minimumTrackTintColor: '#577BFF',
        processHeight: 7,
    };

    state = {
        process: 0,
        processWidth: 0,
    };

    constructor(props) {
        super(props);
        this._onPanResponderGrant = this._onPanResponderGrant.bind(this);
        this._onPanResponderEnd = this._onPanResponderEnd.bind(this);
        this._onPanResponderMove = this._onPanResponderMove.bind(this);
    }

    componentWillMount() {
        this.watcher = PanResponder.create({
            // 建立监视器
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: this._onPanResponderGrant, // 按下
            onPanResponderMove: this._onPanResponderMove, // 移动
            onPanResponderEnd: this._onPanResponderEnd, // 结束
        });
        const {
            defaultValue, min, max, thumbSize,
        } = this.props;
        const process = defaultValue / (max - min);

        this.setState({
            process,
            processWidth: ScreenWidth - thumbSize,
        });
    }

    _onPanResponderGrant(e, gestureState) {
        const { thumbSize } = this.props;
        const { processWidth } = this.state;

        const process = (gestureState.x0 - thumbSize / 2) / processWidth;

        this._changeProcess(process);
    }

    _onPanResponderMove(e, gestureState) {
        const { thumbSize } = this.props;
        const { processWidth } = this.state;

        const process = (gestureState.x0 - thumbSize / 2 + gestureState.dx) / processWidth;

        this._changeProcess(process);
    }

    _onPanResponderEnd(e, gestureState) {
        const { onAfterChange } = this.props;

        if (onAfterChange) {
            onAfterChange(gestureState.x0);
        }
    }

    _changeProcess(changeProcess) {
        // 判断滑动开关
        const { disabled } = this.props;

        if (disabled) return;

        const {
            min, max, step, onChange,
        } = this.props;
        const { process } = this.state;

        if (changeProcess >= 0 && changeProcess <= 1) {
            onChange(changeProcess);

            // 按步长比例变化刻度
            const v = changeProcess * (max - min);
            const newValue = Math.round(v / step) * step;
            const newProcess = newValue / (max - min);

            if (process !== newProcess) {
                this.setState({
                    process: newProcess,
                });
            }
        }
    }

    _getThumbView() {
        const { thumbImage, thumbSize } = this.props;
        const { process, processWidth } = this.state;

        if (thumbImage) {
            return (
                <Image
                    style={{
                        width: thumbSize,
                        height: thumbSize,
                        position: 'absolute',
                        left: process * processWidth,
                    }}
                    source={thumbImage}
                />
            );
        }

        return (
            <View
                style={{
                    width: thumbSize,
                    height: thumbSize,
                    position: 'absolute',
                    left: process * processWidth,
                    borderRadius: thumbSize / 2,
                    backgroundColor: '#808080',
                }}
            />
        );
    }

    render() {
        const {
            height,
            width,
            maximumTrackTintColor,
            minimumTrackTintColor,
            thumbSize,
            processHeight,
        } = this.props;
        const { process, processWidth } = this.state;

        return (
            <View
                style={[
                    styles.container,
                    {
                        height,
                        width,
                    },
                ]}
                {...this.watcher.panHandlers}
            >
                <View
                    style={{
                        backgroundColor: minimumTrackTintColor,
                        width: process * processWidth,
                        height: processHeight,
                        marginLeft: thumbSize / 2,
                    }}
                />

                <View
                    style={{
                        backgroundColor: maximumTrackTintColor,
                        flex: 1,
                        height: processHeight,
                        marginRight: thumbSize / 2,
                    }}
                />

                {this._getThumbView()}
            </View>
        );
    }
}
